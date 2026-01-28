import "server-only";

import type { BrightDataTool } from "@/lib/mcp/bright-data";
import type { SearchRunResult } from "./types";
import { logDiscovery } from "./logger";

type SearchToolOptions = {
  engine?: "google" | "bing" | "yandex";
  pages?: number;
  cursorStart?: number;
};

export async function runSearchQueries(
  searchTool: BrightDataTool,
  queries: string[],
  options: SearchToolOptions = {}
): Promise<SearchRunResult[]> {
  const engine = options.engine ?? "google";
  const pages = Math.max(1, options.pages ?? 2);
  const cursorStart = options.cursorStart ?? 1;

  const tasks = queries.flatMap((query) => {
    return Array.from({ length: pages }, (_, index) => {
      const cursor = cursorStart + index;
      return (async () => {
        try {
          logDiscovery("search.start", { query, cursor, engine });
          const raw = await searchTool.invoke({
            query,
            cursor: String(cursor),
            engine,
          });
          logDiscovery("search.success", {
            query,
            cursor,
            rawType: typeof raw,
          });
          return { query, cursor, raw };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          logDiscovery("search.error", { query, cursor, error: message });
          return { query, cursor, error: message };
        }
      })();
    });
  });

  return Promise.all(tasks);
}
