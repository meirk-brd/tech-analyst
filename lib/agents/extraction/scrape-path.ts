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

export async function scrapePath(
  category: ScrapeCategory,
  candidates: string[],
  scrapeTool: BrightDataTool,
  companyName?: string
): Promise<ScrapeResult | null> {
  const emitter = getProgressEmitter();
  let tool = scrapeTool;

  for (const url of candidates) {
    try {
      if (shouldUseCache()) {
        const cached = await getCachedPage(url);
        const cachedValue = pickCachedContent(cached, category);
        if (cachedValue) {
          logExtraction("cache.hit", { category, url });
          emitter?.emit({
            stage: "extraction",
            substage: "extracting",
            message: `Cache hit: ${companyName || "unknown"} (${category})`,
            company: companyName,
          });
          return { url, content: cachedValue };
        }
      }

      logExtraction("scrape.start", { category, url });
      const result = await invokeScrapeWithRecovery(tool, url);
      tool = result.tool;
      const raw = result.raw;
      const content = normalizeScrapeOutput(raw);
      if (!content || content.length < MIN_CONTENT_LENGTH) {
        logExtraction("scrape.empty", { category, url });
        continue;
      }

      if (shouldUseCache()) {
        await cachePage(url, { [category]: content });
      }

      logExtraction("scrape.success", { category, url, size: content.length });
      return { url, content };
    } catch (error) {
      const message = getErrorMessage(error);
      logExtraction("scrape.error", { category, url, error: message });
    }
  }

  return null;
}
