import type { ScoredCompany } from "@/lib/agents/synthesis/types";

export type VisualizationScores = Array<
  Pick<ScoredCompany, "company" | "vision" | "execution" | "quadrant">
>;

export type ImageResult = {
  mimeType: string;
  base64: string;
  dataUrl: string;
};
