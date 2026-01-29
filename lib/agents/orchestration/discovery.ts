import "server-only";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

import { generateSearchQueries } from "@/lib/agents/discovery/generate-search-queries";
import { runSearchQueries } from "@/lib/agents/discovery/run-search-queries";
import { extractCompanyLeads } from "@/lib/agents/discovery/extract-company-leads";
import { dedupeCompanyLeads } from "@/lib/agents/discovery/dedupe-company-leads";
import { getBrightDataTool } from "@/lib/mcp/bright-data";
import { getProgressEmitter } from "./progress";
import type { CompanyLead } from "./types";

export async function runDiscovery(
  marketSector: string
): Promise<{ companies: CompanyLead[]; queries: string[] }> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error("Missing GOOGLE_AI_API_KEY.");
  }

  const emitter = getProgressEmitter();

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0.7,
    apiKey: process.env.GOOGLE_AI_API_KEY,
  });

  // Emit: generating queries
  emitter?.emit({
    stage: "discovery",
    substage: "queries",
    message: "Generating search queries with AI...",
  });

  const queries = await generateSearchQueries(llm, marketSector);

  emitter?.emit({
    stage: "discovery",
    substage: "queries",
    message: `Generated ${queries.length} targeted search queries`,
  });

  const searchTool = await getBrightDataTool("search_engine");
  const totalSearches = queries.length * 3; // 3 pages each

  // Emit: starting searches
  emitter?.emit({
    stage: "discovery",
    substage: "searching",
    message: `Executing ${totalSearches} parallel searches...`,
    progress: 0,
    total: totalSearches,
  });

  const searchResults = await runSearchQueries(searchTool, queries, {
    engine: "google",
    pages: 3,
    cursorStart: 1,
    onProgress: (completed) => {
      emitter?.emit({
        stage: "discovery",
        substage: "searching",
        message: `Searching... ${completed}/${totalSearches}`,
        progress: completed,
        total: totalSearches,
      });
    },
  });

  // Emit: extracting leads
  emitter?.emit({
    stage: "discovery",
    substage: "extracting",
    message: "Extracting company leads from search results...",
  });

  const rawLeads = extractCompanyLeads(searchResults);

  // Emit: deduplicating
  emitter?.emit({
    stage: "discovery",
    substage: "deduplicating",
    message: `Found ${rawLeads.length} leads, deduplicating...`,
  });

  const leads = dedupeCompanyLeads(rawLeads, 30);
  const companies = leads.map((lead) => ({ name: lead.name, url: lead.url }));

  return { companies, queries };
}
