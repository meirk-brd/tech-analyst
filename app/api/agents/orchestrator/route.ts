import { NextResponse } from "next/server";

import { getAnalysisApp } from "@/lib/agents/orchestration/analysis-graph";

// Pipeline takes 1-5 minutes. Vercel Pro Fluid caps at 800s; raise the
// per-route budget explicitly so we don't inherit whatever the platform
// default is on the day of deploy.
export const maxDuration = 800;

import { parseMarketSector } from "@/lib/agents/orchestration/parse-input";
import { createProgressEmitter, clearProgressEmitter } from "@/lib/agents/orchestration/progress";
import type { Visualizations } from "@/lib/agents/orchestration/types";
import { createSession, updateSession, writeProgress } from "@/lib/db/mongodb";
import { getRateLimitInfo, getClientIP, hasInternalBypass } from "@/lib/rate-limiter";

function wantsStream(request: Request): boolean {
  const url = new URL(request.url);
  if (url.searchParams.get("stream") === "true") return true;
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/event-stream");
}

function extractVisualizationsPayload(visualizations?: Visualizations) {
  if (!visualizations) return undefined;
  return {
    quadrant: visualizations.quadrant?.dataUrl ?? "",
    wave: visualizations.wave?.dataUrl ?? "",
    radar: visualizations.radar?.dataUrl ?? "",
    chartData: visualizations.chartData,
  };
}

export async function POST(request: Request) {
  // Rate limit check — skipped when the request carries the shared internal token.
  const internalBypass = hasInternalBypass(request);
  const ip = await getClientIP();
  const rateLimit = internalBypass
    ? { allowed: true, current: 0, limit: Number.POSITIVE_INFINITY, remaining: Number.POSITIVE_INFINITY }
    : await getRateLimitInfo(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "RATE_LIMITED",
        message: "You have reached the usage limit",
        limit: rateLimit.limit,
        current: rateLimit.current,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": "0",
          "Retry-After": "86400",
        },
      }
    );
  }

  const body = await request.json().catch(() => null);
  const marketSector = parseMarketSector(body);

  if (!marketSector) {
    return NextResponse.json(
      { error: "marketSector is required." },
      { status: 400 }
    );
  }

  // Create session in database
  let sessionId: string | null = null;
  try {
    sessionId = await createSession(marketSector);
    await updateSession(sessionId, { status: "processing" });
  } catch (error) {
    // Log but don't fail - session tracking is non-critical
    console.error("Failed to create session:", error);
  }

  const app = getAnalysisApp();
  const config = {
    configurable: {
      thread_id: crypto.randomUUID(),
      max_concurrency: 90,
    },
  };

  if (!wantsStream(request)) {
    try {
      const result = await app.invoke(
        { marketSector, status: "discovery" },
        config
      );

      // Save successful result to session
      if (sessionId) {
        await updateSession(sessionId, {
          status: "completed",
          result: {
            companies: result.companies,
            scores: result.scores,
            visualizations: extractVisualizationsPayload(result.visualizations),
            csv: result.csv,
          },
        }).catch((e) => console.error("Failed to save session:", e));
      }

      return NextResponse.json({ ...result, sessionId });
    } catch (error) {
      // Save error to session
      if (sessionId) {
        const message = error instanceof Error ? error.message : String(error);
        await updateSession(sessionId, {
          status: "failed",
          error: message,
        }).catch((e) => console.error("Failed to save session error:", e));
      }
      throw error;
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Swallow enqueue errors after the consumer disconnects. The MCP
      // adapter intentionally closes the SSE connection early after
      // capturing the session id (fire-and-poll, since MCP clients cap
      // tool calls at 60s). The pipeline must continue running and
      // writing to MongoDB regardless of consumer state.
      let consumerGone = false;
      const send = (payload: unknown) => {
        if (consumerGone) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
          );
        } catch (e: unknown) {
          // ERR_INVALID_STATE means the controller is closed (consumer
          // disconnected). Stop trying; let the pipeline finish quietly.
          if (e instanceof TypeError || (e as { code?: string })?.code === "ERR_INVALID_STATE") {
            consumerGone = true;
            return;
          }
          throw e;
        }
      };

      // Set up progress emitter to forward granular events to SSE
      const progressEmitter = createProgressEmitter();
      progressEmitter.setCallback((event) => {
        // Forward to SSE consumers (existing behavior — UI relies on this).
        send({
          type: "progress",
          stage: event.stage,
          substage: event.substage,
          message: event.message,
          progress: event.progress,
          total: event.total,
          company: event.company,
        });
        // Also persist to MongoDB for MCP polling (throttled inside writeProgress).
        if (sessionId) {
          void writeProgress(sessionId, {
            status: "processing",
            stage: event.stage,
            substage: event.substage,
            done: event.progress,
            total: event.total,
            current: event.company,
            message: event.message,
          });
        }
      });

      try {
        // Send session ID in the first event
        send({ type: "session", sessionId });

        for await (const event of await app.stream(
          { marketSector, status: "discovery" },
          { ...config, streamMode: "updates" }
        )) {
          const nodeName = Object.keys(event)[0] as keyof typeof event;
          const nodeOutput = event[nodeName];

          // Send stage completion events (these mark the transition to the next stage)
          if (nodeName === "discovery") {
            const discovery = nodeOutput as { companies?: unknown[] };
            send({
              type: "progress",
              stage: "discovery",
              message: `Discovered ${discovery?.companies?.length || 0} potential companies`,
            });
          } else if (nodeName === "enrichment") {
            const enrichment = nodeOutput as { enrichedCompanies?: unknown[] };
            send({
              type: "progress",
              stage: "enrichment",
              message: `Validated ${enrichment?.enrichedCompanies?.length || 0} companies for analysis`,
            });
          } else if (nodeName === "extraction") {
            const extraction = nodeOutput as { extractedData?: unknown[] };
            send({
              type: "progress",
              stage: "extraction",
              message: `Extracted data from ${extraction?.extractedData?.length || 0} companies`,
            });
          } else if (nodeName === "synthesis") {
            const synthesis = nodeOutput as { scores?: unknown[] };
            send({
              type: "progress",
              stage: "synthesis",
              message: `Scored ${synthesis?.scores?.length || 0} companies`,
            });
          } else if (nodeName === "visualization") {
            send({
              type: "progress",
              stage: "visualization",
              message: "Generated charts",
            });
          }
        }

        if (typeof (app as any).getState === "function") {
          const finalState = await (app as any).getState(config);
          const result = finalState.values ?? finalState;

          // Save successful result to session
          if (sessionId) {
            await updateSession(sessionId, {
              status: "completed",
              result: {
                companies: result.companies,
                scores: result.scores,
                visualizations: extractVisualizationsPayload(result.visualizations),
                csv: result.csv,
              },
            }).catch((e) => console.error("Failed to save session:", e));
            await writeProgress(sessionId, {
              status: "completed",
              stage: "visualization",
              message: "Analysis complete",
              companyCount: result.companies?.length ?? 0,
            });
          }

          send({
            type: "complete",
            sessionId,
            result,
          });
        } else {
          send({ type: "complete", sessionId });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        // Save error to session
        if (sessionId) {
          await updateSession(sessionId, {
            status: "failed",
            error: message,
          }).catch((e) => console.error("Failed to save session error:", e));
          await writeProgress(sessionId, {
            status: "failed",
            stage: "discovery", // best-effort; we don't know which stage failed at this layer
            message: `Pipeline failed: ${message}`,
            error: message,
          });
        }

        send({ type: "error", error: message, sessionId });
      } finally {
        clearProgressEmitter();
        try { controller.close(); } catch { /* already closed by consumer disconnect */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
