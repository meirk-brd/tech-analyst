import { NextResponse } from "next/server";

import { getAnalysisApp } from "@/lib/agents/orchestration/analysis-graph";
import { parseMarketSector } from "@/lib/agents/orchestration/parse-input";
import type { Visualizations } from "@/lib/agents/orchestration/types";
import { createSession, updateSession } from "@/lib/db/mongodb";
import { getRateLimitInfo, getClientIP } from "@/lib/rate-limiter";

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
  // Rate limit check
  const ip = await getClientIP();
  const rateLimit = await getRateLimitInfo(ip);

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
      const send = (payload: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        );
      };

      try {
        // Send session ID in the first event
        send({ type: "session", sessionId });

        for await (const event of await app.stream(
          { marketSector, status: "discovery" },
          { ...config, streamMode: "updates" }
        )) {
          const nodeName = Object.keys(event)[0] as keyof typeof event;
          const nodeOutput = event[nodeName];

          if (nodeName === "discovery") {
            const discovery = nodeOutput as { companies?: unknown[] };
            send({
              type: "progress",
              stage: "discovery",
              message: `Found ${discovery?.companies?.length || 0} companies`,
            });
          } else if (nodeName === "extraction") {
            const extraction = nodeOutput as { extractedData?: unknown[] };
            send({
              type: "progress",
              stage: "extraction",
              message: `Extracted ${extraction?.extractedData?.length || 0} companies`,
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
        }

        send({ type: "error", error: message, sessionId });
      } finally {
        controller.close();
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
