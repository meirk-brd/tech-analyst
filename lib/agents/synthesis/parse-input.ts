import "server-only";

import type { ExtractedCompanyData } from "@/lib/agents/extraction/types";

type Payload = {
  extractedData?: unknown;
  data?: unknown;
  includeNarratives?: unknown;
  normalizeScores?: unknown;
};

export function parseSynthesisInput(body: unknown): {
  extractedData: ExtractedCompanyData[] | null;
  includeNarratives: boolean;
  normalizeScores: boolean;
} {
  if (!body || typeof body !== "object") {
    return { extractedData: null, includeNarratives: false, normalizeScores: true };
  }

  const payload = body as Payload;
  const raw = payload.extractedData ?? payload.data;
  const includeNarratives =
    payload.includeNarratives === true || payload.includeNarratives === "true";
  const normalizeScores =
    payload.normalizeScores === false || payload.normalizeScores === "false"
      ? false
      : true;

  if (!Array.isArray(raw)) {
    return { extractedData: null, includeNarratives, normalizeScores };
  }

  const normalized = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const company = (item as ExtractedCompanyData).company;
      const url = (item as ExtractedCompanyData).url;
      if (typeof company !== "string" || typeof url !== "string") return null;
      return item as ExtractedCompanyData;
    })
    .filter(Boolean) as ExtractedCompanyData[];

  return {
    extractedData: normalized.length ? normalized : null,
    includeNarratives,
    normalizeScores,
  };
}
