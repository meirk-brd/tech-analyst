import "server-only";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Annotation, Send, StateGraph } from "@langchain/langgraph";

import { getBrightDataTool, resetBrightDataClient, type BrightDataTool } from "@/lib/mcp/bright-data";
import { cachePage, getCachedPage, type CacheCategory } from "@/lib/db/mongodb";
import type { CompanyLead } from "../discovery/types";
import type { EnrichmentStats, ScrapedPage } from "./types";
import { reflectForCompanies } from "./reflect-for-companies";
import { normalizeToHomepage, dedupeByDomain, shouldSkipUrl } from "./utils";
import { logEnrichment } from "./logger";

const MIN_CONTENT_LENGTH = 80;
const CACHE_CATEGORY: CacheCategory = "enrichment";

const EnrichmentState = Annotation.Root({
  marketSector: Annotation<string>(),
  leads: Annotation<CompanyLead[]>(),
  scrapedPages: Annotation<ScrapedPage[]>({
    reducer: (left, right) => [...(left || []), ...(right || [])],
    default: () => [],
  }),
  enrichedCompanies: Annotation<CompanyLead[]>(),
  stats: Annotation<EnrichmentStats>(),
  skippedCount: Annotation<number>({
    reducer: (left, right) => (left || 0) + (right || 0),
    default: () => 0,
  }),
});

type LeadEnrichmentState = {
  lead: CompanyLead;
  marketSector: string;
};

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

async function scrapeUrlWithRecovery(
  url: string,
  tool: BrightDataTool
): Promise<string | null> {
  // Check cache first
  if (shouldUseCache()) {
    const cached = await getCachedPage(url);
    if (cached?.data?.[CACHE_CATEGORY]) {
      logEnrichment("cache.hit", { url });
      return cached.data[CACHE_CATEGORY];
    }
  }

  logEnrichment("scrape.start", { url });

  try {
    const raw = await tool.invoke({ url });
    const content = normalizeScrapeOutput(raw);

    if (!content || content.length < MIN_CONTENT_LENGTH) {
      logEnrichment("scrape.empty", { url });
      return null;
    }

    // Cache the result
    if (shouldUseCache()) {
      await cachePage(url, { [CACHE_CATEGORY]: content });
    }

    logEnrichment("scrape.success", { url, size: content.length });
    return content;
  } catch (error) {
    if (isSessionNotFound(error)) {
      logEnrichment("scrape.session.reset", { url });
      await resetBrightDataClient();
      const freshTool = await getBrightDataTool("scrape_as_markdown");
      try {
        const raw = await freshTool.invoke({ url });
        const content = normalizeScrapeOutput(raw);
        if (content && content.length >= MIN_CONTENT_LENGTH) {
          if (shouldUseCache()) {
            await cachePage(url, { [CACHE_CATEGORY]: content });
          }
          return content;
        }
      } catch (retryError) {
        logEnrichment("scrape.error", { url, error: getErrorMessage(retryError) });
      }
    } else {
      logEnrichment("scrape.error", { url, error: getErrorMessage(error) });
    }
    return null;
  }
}

function fanOutEnrichment(state: typeof EnrichmentState.State): Send[] {
  const validLeads: Send[] = [];
  let skipped = 0;

  for (const lead of state.leads) {
    if (shouldSkipUrl(lead.url)) {
      skipped++;
      logEnrichment("skip.url", { url: lead.url, reason: "blocklisted domain" });
      continue;
    }
    validLeads.push(
      new Send("scrapeAndReflect", {
        lead,
        marketSector: state.marketSector,
      })
    );
  }

  logEnrichment("fanout", {
    total: state.leads.length,
    processing: validLeads.length,
    skipped,
  });

  // Return skipped count update along with Send commands
  // Note: We handle skipped count in aggregation since Send doesn't allow state updates
  return validLeads;
}

async function scrapeAndReflect(
  state: LeadEnrichmentState
): Promise<{ scrapedPages: ScrapedPage[] }> {
  const { lead, marketSector } = state;
  logEnrichment("lead.start", { name: lead.name, url: lead.url });

  const scrapeTool = await getBrightDataTool("scrape_as_markdown");
  const content = await scrapeUrlWithRecovery(lead.url, scrapeTool);

  if (!content) {
    logEnrichment("lead.no-content", { url: lead.url });
    return {
      scrapedPages: [{ url: lead.url, companies: [], error: "No content scraped" }],
    };
  }

  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error("Missing GOOGLE_AI_API_KEY.");
  }

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0,
    apiKey: process.env.GOOGLE_AI_API_KEY,
  });

  const reflection = await reflectForCompanies(
    { url: lead.url, content, marketSector },
    llm
  );

  const companies: CompanyLead[] = [];

  // If this is a company page, add the company itself
  if (reflection.isCompanyPage && reflection.companyName) {
    companies.push({
      name: reflection.companyName,
      url: normalizeToHomepage(lead.url),
    });
  }

  // Add any extracted companies from the page
  for (const extracted of reflection.extractedCompanies) {
    if (extracted.url) {
      companies.push({
        name: extracted.name,
        url: normalizeToHomepage(extracted.url),
      });
    } else if (extracted.name) {
      // Company mentioned without URL - we could try to search for it later
      // For now, skip companies without URLs
      logEnrichment("lead.no-url", { name: extracted.name, sourceUrl: lead.url });
    }
  }

  logEnrichment("lead.done", {
    url: lead.url,
    isCompanyPage: reflection.isCompanyPage,
    extractedCount: companies.length,
  });

  return {
    scrapedPages: [{ url: lead.url, companies }],
  };
}

function aggregateCompanies(state: typeof EnrichmentState.State) {
  const allCompanies = state.scrapedPages.flatMap((p) => p.companies);
  const deduped = dedupeByDomain(allCompanies);

  // Count skipped URLs (those that weren't processed)
  const processedUrls = new Set(state.scrapedPages.map((p) => p.url));
  const skippedCount = state.leads.filter((l) => !processedUrls.has(l.url)).length;

  const stats: EnrichmentStats = {
    inputLeads: state.leads.length,
    pagesScraped: state.scrapedPages.length,
    companiesExtracted: allCompanies.length,
    afterDedupe: deduped.length,
    skippedUrls: skippedCount,
  };

  logEnrichment("aggregate", stats);

  return {
    enrichedCompanies: deduped,
    stats,
  };
}

const enrichmentWorkflow = new StateGraph(EnrichmentState)
  .addNode("scrapeAndReflect", scrapeAndReflect)
  .addNode("aggregate", aggregateCompanies, { defer: true } as any)
  .addConditionalEdges("__start__", fanOutEnrichment, ["scrapeAndReflect"])
  .addEdge("scrapeAndReflect", "aggregate")
  .addEdge("aggregate", "__end__");

let cachedApp: ReturnType<typeof enrichmentWorkflow.compile> | null = null;

export function getEnrichmentApp() {
  if (!cachedApp) {
    cachedApp = enrichmentWorkflow.compile();
  }
  return cachedApp;
}
