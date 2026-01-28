import type { ExtractedCompanyData } from "@/lib/agents/extraction/types";

export type ScoreBreakdown = {
  featureDepth: number;
  innovation: number;
  positioning: number;
  pricingMaturity: number;
  enterprisePresence: number;
  documentationQuality: number;
  viability: number;
};

export type ScoredCompany = {
  company: string;
  url: string;
  vision: number;
  execution: number;
  quadrant: "Leaders" | "Challengers" | "Visionaries" | "Niche Players";
  breakdown: ScoreBreakdown;
  raw: ExtractedCompanyData;
};

export type SynthesisResult = {
  scores: ScoredCompany[];
  csv: string;
  narratives?: Array<{ company: string; narrative: string }>;
};
