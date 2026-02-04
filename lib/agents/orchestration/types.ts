import type { ExtractedCompanyData } from "@/lib/agents/extraction/types";
import type { ScoredCompany } from "@/lib/agents/synthesis/types";
import type { ImageResult } from "@/lib/agents/visualization/types";
import type { ChartDataResult } from "@/lib/agents/visualization/generate-chart-data";

export type AnalysisStatus =
  | "discovery"
  | "enrichment"
  | "extraction"
  | "synthesis"
  | "visualization"
  | "completed"
  | "failed";

export type CompanyLead = {
  name: string;
  url: string;
};

/**
 * Visualizations can contain either:
 * - Pre-rendered images (ImageResult) from AI generation (legacy)
 * - Chart data for client-side rendering with Recharts (new)
 * - Pyramid visualization showing tiered company categorization
 */
export type Visualizations = {
  quadrant: ImageResult;
  wave: ImageResult;
  radar: ImageResult;
  /** Pyramid visualization showing 3-tier company categorization */
  pyramid?: ImageResult;
  /** Chart data for client-side rendering (default; set USE_RECHARTS=false to use AI) */
  chartData?: ChartDataResult;
};

export type AnalysisOutput = {
  marketSector: string;
  companies: CompanyLead[];
  extractedData: ExtractedCompanyData[];
  scores: ScoredCompany[];
  csv: string;
  visualizations: Visualizations;
};
