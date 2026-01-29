import "server-only";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Annotation, Send, StateGraph } from "@langchain/langgraph";

import { getBrightDataTool } from "@/lib/mcp/bright-data";
import { getProgressEmitter } from "@/lib/agents/orchestration/progress";
import { detectPaths } from "./detect-paths";
import { scrapePath } from "./scrape-path";
import { reflectOnScrapedPages } from "./reflect-extraction";
import type { CompanyInput, ExtractedCompanyData } from "./types";
import { logExtraction } from "./logger";

const ExtractionState = Annotation.Root({
  companies: Annotation<CompanyInput[]>(),
  extractedData: Annotation<ExtractedCompanyData[]>({
    reducer: (left, right) => [...(left || []), ...(right || [])],
    default: () => [],
  }),
  status: Annotation<"pending" | "extracting" | "completed">(),
});

type CompanyExtractionState = {
  company: CompanyInput;
};

// Track extraction progress globally for this request
let extractionProgress = { completed: 0, total: 0 };

function fanOutExtraction(state: typeof ExtractionState.State): Send[] {
  logExtraction("fanout", { companies: state.companies.length });

  // Initialize progress tracking
  extractionProgress = { completed: 0, total: state.companies.length };

  const emitter = getProgressEmitter();
  emitter?.emit({
    stage: "extraction",
    substage: "extracting",
    message: `Extracting data from ${state.companies.length} companies...`,
    progress: 0,
    total: state.companies.length,
  });

  return state.companies.map((company) => new Send("extractSingleCompany", { company }));
}

async function extractSingleCompany(
  state: CompanyExtractionState
): Promise<{ extractedData: ExtractedCompanyData[] }> {
  const { company } = state;
  const emitter = getProgressEmitter();

  logExtraction("company.start", { company: company.name });

  // Emit progress for this company
  emitter?.emit({
    stage: "extraction",
    substage: "extracting",
    message: `Extracting ${company.name}...`,
    company: company.name,
    progress: extractionProgress.completed,
    total: extractionProgress.total,
  });

  const scrapeTool = await getBrightDataTool("scrape_as_markdown");
  const paths = detectPaths(company.url);

  const [pricing, docs, about] = await Promise.all([
    scrapePath("pricing", paths.pricing, scrapeTool, company.name),
    scrapePath("docs", paths.docs, scrapeTool, company.name),
    scrapePath("about", paths.about, scrapeTool, company.name),
  ]);

  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error("Missing GOOGLE_AI_API_KEY.");
  }

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0,
    apiKey: process.env.GOOGLE_AI_API_KEY,
  });

  const extracted = await reflectOnScrapedPages(
    {
      company: company.name,
      url: company.url,
      pricing,
      docs,
      about,
    },
    llm
  );

  logExtraction("company.done", { company: company.name });

  extractionProgress.completed++;

  return { extractedData: [extracted] };
}

function aggregateResults(state: typeof ExtractionState.State) {
  logExtraction("aggregate", { total: state.extractedData.length });
  return {
    status: "completed" as const,
  };
}

const extractionWorkflow = new StateGraph(ExtractionState)
  .addNode("extractSingleCompany", extractSingleCompany)
  .addNode("aggregate", aggregateResults, { defer: true } as any)
  .addConditionalEdges("__start__", fanOutExtraction, ["extractSingleCompany"])
  .addEdge("extractSingleCompany", "aggregate")
  .addEdge("aggregate", "__end__");

const workflowAny = extractionWorkflow as any;
if (typeof workflowAny.updateNode === "function") {
  workflowAny.updateNode("extractSingleCompany", {
    retryPolicy: {
      maxAttempts: 3,
      backoffFactor: 2,
      retryOn: (error: Error) => {
        return (
          error.message.includes("rate limit") ||
          error.message.includes("429") ||
          error.message.includes("timeout")
        );
      },
    },
  });
}

let cachedApp: ReturnType<typeof extractionWorkflow.compile> | null = null;

export function getExtractionApp() {
  if (!cachedApp) {
    cachedApp = extractionWorkflow.compile();
  }
  return cachedApp;
}
