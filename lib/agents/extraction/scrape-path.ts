import "server-only";

import {
  getBrightDataTool,
  resetBrightDataClient,
  type BrightDataTool,
} from "@/lib/mcp/bright-data";
import { cachePage, getCachedPage } from "@/lib/db/mongodb";
import { getProgressEmitter } from "@/lib/agents/orchestration/progress";
import type { ScrapeCategory, ScrapeResult } from "./types";
import { logExtraction } from "./logger";

const MIN_CONTENT_LENGTH = 80;
const SCRAPE_TOOL_NAME = "scrape_as_markdown";

function normalizeScrapeOutput(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const candidates = ["markdown", "content", "text", "result", "data"];
    for (const key of candidates) {
      const value = obj[key];
      if (typeof value === "string") return value.trim();
    }
    try {
      return JSON.stringify(obj);
    } catch {
      return null;
    }
  }
  return null;
}

function shouldUseCache(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isSessionNotFound(error: unknown): boolean {
  const message = getErrorMessage(error);
  return message.includes("Session not found") || message.includes("code\":-32001");
}

async function invokeScrapeWithRecovery(
  tool: BrightDataTool,
  url: string
): Promise<{ raw: unknown; tool: BrightDataTool }> {
  try {
    const raw = await tool.invoke({ url });
    return { raw, tool };
  } catch (error) {
    if (!isSessionNotFound(error)) {
      throw error;
    }

    logExtraction("scrape.session.reset", { url, error: getErrorMessage(error) });
    await resetBrightDataClient();
    const freshTool = await getBrightDataTool(SCRAPE_TOOL_NAME);
    const raw = await freshTool.invoke({ url });
    return { raw, tool: freshTool };
  }
}

function pickCachedContent(
  cached: Awaited<ReturnType<typeof getCachedPage>> | null,
  category: ScrapeCategory
): string | null {
  if (!cached?.data) return null;
  const value = cached.data[category];
  return value ?? null;
}

/**
 * Resolves with the first candidate URL whose scrape (or cache) yields enough
 * content. Runs all candidates in parallel — previously this loop was sequential
 * and accounted for most of the cold-run extraction wall time.
 *
 * Two phases:
 *   1) Check the MongoDB cache for every candidate in parallel. If any hits,
 *      return that result immediately and skip Bright Data entirely.
 *   2) For all cold candidates, fire Bright Data scrapes in parallel and return
 *      the first one that returns content >= MIN_CONTENT_LENGTH. The other
 *      in-flight scrapes are not awaited — their results are still cached if
 *      they land before the request closes (best-effort, dangling).
 */
export async function scrapePath(
  category: ScrapeCategory,
  candidates: string[],
  scrapeTool: BrightDataTool,
  companyName?: string
): Promise<ScrapeResult | null> {
  const emitter = getProgressEmitter();
  if (candidates.length === 0) return null;

  // Phase 1: check caches in parallel.
  if (shouldUseCache()) {
    const cacheLookups = await Promise.all(
      candidates.map(async (url) => {
        try {
          const cached = await getCachedPage(url);
          return { url, value: pickCachedContent(cached, category) };
        } catch {
          return { url, value: null as string | null };
        }
      })
    );
    // Pick the first candidate (in declared priority order) that has a cache hit.
    for (const { url, value } of cacheLookups) {
      if (value) {
        logExtraction("cache.hit", { category, url });
        emitter?.emit({
          stage: "extraction",
          substage: "extracting",
          message: `Cache hit: ${companyName || "unknown"} (${category})`,
          company: companyName,
        });
        return { url, content: value };
      }
    }
  }

  // Phase 2: race cold scrapes in parallel. Resolve on the first one that
  // returns enough content. We do NOT short-circuit candidate priority order
  // here — racing means whichever URL Bright Data finishes first wins, which
  // is fine for the demo since detect-paths.ts already only emits valid
  // category candidates.
  return await new Promise<ScrapeResult | null>((resolve) => {
    let pending = candidates.length;
    let resolved = false;

    candidates.forEach((url) => {
      (async () => {
        try {
          logExtraction("scrape.start", { category, url });
          const result = await invokeScrapeWithRecovery(scrapeTool, url);
          const content = normalizeScrapeOutput(result.raw);
          if (!content || content.length < MIN_CONTENT_LENGTH) {
            logExtraction("scrape.empty", { category, url });
            return;
          }
          // Cache regardless of who wins the race — keeps cache warm for
          // future runs.
          if (shouldUseCache()) {
            cachePage(url, { [category]: content }).catch((err) => {
              logExtraction("scrape.cache.error", {
                category,
                url,
                error: getErrorMessage(err),
              });
            });
          }
          logExtraction("scrape.success", { category, url, size: content.length });
          if (!resolved) {
            resolved = true;
            resolve({ url, content });
          }
        } catch (error) {
          logExtraction("scrape.error", {
            category,
            url,
            error: getErrorMessage(error),
          });
        } finally {
          pending--;
          if (pending === 0 && !resolved) {
            resolved = true;
            resolve(null);
          }
        }
      })();
    });
  });
}
