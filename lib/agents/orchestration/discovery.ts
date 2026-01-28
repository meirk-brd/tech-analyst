import "server-only";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

import { generateSearchQueries } from "@/lib/agents/discovery/generate-search-queries";
import { runSearchQueries } from "@/lib/agents/discovery/run-search-queries";
import { extractCompanyLeads } from "@/lib/agents/discovery/extract-company-leads";
import { dedupeCompanyLeads } from "@/lib/agents/discovery/dedupe-company-leads";
import { getBrightDataTool } from "@/lib/mcp/bright-data";
import type { CompanyLead } from "./types";

export async function runDiscovery(
  marketSector: string
): Promise<{ companies: CompanyLead[]; queries: string[] }> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error("Missing GOOGLE_AI_API_KEY.");
  }

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0.7,
    apiKey: process.env.GOOGLE_AI_API_KEY,
  });

  const queries = await generateSearchQueries(llm, marketSector);
  const searchTool = await getBrightDataTool("search_engine");
  const searchResults = await runSearchQueries(searchTool, queries, {
    engine: "google",
    pages: 3,
    cursorStart: 1,
  });

  const leads = dedupeCompanyLeads(extractCompanyLeads(searchResults), 30);
  const companies = leads.map((lead) => ({ name: lead.name, url: lead.url }));

  return { companies, queries };
}
