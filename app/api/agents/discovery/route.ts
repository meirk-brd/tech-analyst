import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

import { generateSearchQueries } from "@/lib/agents/discovery/generate-search-queries";
import { runSearchQueries } from "@/lib/agents/discovery/run-search-queries";
import { extractCompanyLeads } from "@/lib/agents/discovery/extract-company-leads";
import { dedupeCompanyLeads } from "@/lib/agents/discovery/dedupe-company-leads";
import { parseMarketSector } from "@/lib/agents/discovery/parse-market-sector";
import { getBrightDataTool } from "@/lib/mcp/bright-data";
import { logDiscovery } from "@/lib/agents/discovery/logger";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const marketSector = parseMarketSector(body);

  if (!marketSector) {
    return NextResponse.json(
      { error: "marketSector is required." },
      { status: 400 }
    );
  }

  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json(
      { error: "Missing GOOGLE_AI_API_KEY." },
      { status: 500 }
    );
  }

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0.7,
    apiKey: process.env.GOOGLE_AI_API_KEY,
  });

  logDiscovery("request.start", { marketSector });

  const queries = await generateSearchQueries(llm, marketSector);
  logDiscovery("queries.generated", { count: queries.length, queries });
  const searchTool = await getBrightDataTool("search_engine");
  const pagesPerQuery = 3;
  const searchResults = await runSearchQueries(searchTool, queries, {
    engine: "google",
    pages: pagesPerQuery,
    cursorStart: 1,
  });
  logDiscovery("search.completed", { totalRuns: searchResults.length });

  const leads = dedupeCompanyLeads(extractCompanyLeads(searchResults), 30);
  logDiscovery("leads.ready", { total: leads.length });

  return NextResponse.json({
    marketSector,
    queries,
    leads,
    meta: {
      totalQueries: queries.length,
      totalResults: searchResults.length,
      pagesPerQuery,
      totalLeads: leads.length,
    },
  });
}
