import "server-only";

import { Annotation, END, MemorySaver, START, StateGraph } from "@langchain/langgraph";

import { runDiscovery } from "./discovery";
import { getEnrichmentApp } from "@/lib/agents/enrichment/enrichment-graph";
import { getExtractionApp } from "@/lib/agents/extraction/extraction-graph";
import { getExtractionMaxConcurrency } from "@/lib/agents/extraction/concurrency";
import { calculateScores } from "@/lib/agents/synthesis/scoring";
import { generateCsv } from "@/lib/agents/synthesis/csv";
import { buildPyramidPrompt } from "@/lib/agents/visualization/prompts";
import { generateImage } from "@/lib/agents/visualization/generate-image";
import type { AnalysisStatus, CompanyLead, Visualizations } from "./types";
import type { ExtractedCompanyData } from "@/lib/agents/extraction/types";
import type { ScoredCompany } from "@/lib/agents/synthesis/types";
import type { ImageResult } from "@/lib/agents/visualization/types";
import { logOrchestration } from "./logger";

const AnalysisState = Annotation.Root({
  marketSector: Annotation<string>(),
  companies: Annotation<CompanyLead[]>(),
  extractedData: Annotation<ExtractedCompanyData[]>({
    reducer: (left, right) => [...(left || []), ...(right || [])],
    default: () => [],
  }),
  scores: Annotation<ScoredCompany[]>(),
  csv: Annotation<string>(),
  visualizations: Annotation<Visualizations>(),
  status: Annotation<AnalysisStatus>(),
  error: Annotation<string | undefined>(),
});

async function discoveryNode(state: typeof AnalysisState.State) {
  logOrchestration("discovery.start", { marketSector: state.marketSector });
  const result = await runDiscovery(state.marketSector);
  const companies = result.companies ?? [];
  logOrchestration("discovery.done", { companies: companies.length });
  return {
    companies,
    status: "enrichment" as const,
  };
}

async function enrichmentNode(state: typeof AnalysisState.State) {
  logOrchestration("enrichment.start", { leads: state.companies?.length ?? 0 });
  const enrichmentApp = getEnrichmentApp();
  const result = await enrichmentApp.invoke({
    marketSector: state.marketSector,
    leads: state.companies ?? [],
  });
  const enrichedCompanies = result.enrichedCompanies ?? [];
  logOrchestration("enrichment.done", {
    input: state.companies?.length ?? 0,
    output: enrichedCompanies.length,
    stats: result.stats,
  });
  return {
    companies: enrichedCompanies,
    status: "extraction" as const,
  };
}

async function extractionNode(state: typeof AnalysisState.State) {
  const companies = state.companies ?? [];
  logOrchestration("extraction.start", { companies: companies.length });
  const extractionApp = getExtractionApp();
  const result = await extractionApp.invoke(
    { companies, status: "pending" },
    {
      configurable: {
        thread_id: crypto.randomUUID(),
        max_concurrency: getExtractionMaxConcurrency(),
      },
    }
  );
  const extractedData = result.extractedData ?? [];
  logOrchestration("extraction.done", { extracted: extractedData.length });
  return {
    extractedData,
    status: "synthesis" as const,
  };
}

function synthesisNode(state: typeof AnalysisState.State) {
  const extractedData = state.extractedData ?? [];
  logOrchestration("synthesis.start", { extracted: extractedData.length });
  const scores = calculateScores(extractedData, { normalize: true });
  const csv = generateCsv(scores);
  logOrchestration("synthesis.done", { scored: scores.length });
  return {
    scores,
    csv,
    status: "visualization" as const,
  };
}

async function visualizationNode(state: typeof AnalysisState.State) {
  const scores = state.scores ?? [];
  logOrchestration("visualization.start", { scores: scores.length });
  const payload = scores.map((score) => ({
    company: score.company,
    vision: score.vision,
    execution: score.execution,
    quadrant: score.quadrant,
  }));

  // Generate pyramid visualization using Gemini AI
  const pyramidPrompt = buildPyramidPrompt(payload, state.marketSector);
  const pyramid = await generateImage(pyramidPrompt);

  // Create placeholder for legacy fields (not used but required by type)
  const placeholderImage: ImageResult = {
    mimeType: "image/png",
    base64: "",
    dataUrl: "",
  };

  logOrchestration("visualization.done", { mode: "pyramid", images: 1 });
  return {
    visualizations: {
      quadrant: placeholderImage,
      wave: placeholderImage,
      radar: placeholderImage,
      pyramid,
    } satisfies Visualizations,
    status: "completed" as const,
  };
}

const workflow = new StateGraph(AnalysisState)
  .addNode("discovery", discoveryNode)
  .addNode("enrichment", enrichmentNode)
  .addNode("extraction", extractionNode)
  .addNode("synthesis", synthesisNode)
  .addNode("visualization", visualizationNode)
  .addEdge(START, "discovery")
  .addEdge("discovery", "enrichment")
  .addEdge("enrichment", "extraction")
  .addEdge("extraction", "synthesis")
  .addEdge("synthesis", "visualization")
  .addEdge("visualization", END);

const checkpointer = new MemorySaver();

let cachedApp: ReturnType<typeof workflow.compile> | null = null;

export function getAnalysisApp() {
  if (!cachedApp) {
    cachedApp = workflow.compile({ checkpointer });
  }
  return cachedApp;
}
