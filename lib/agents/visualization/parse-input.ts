import "server-only";

import type { VisualizationScores } from "./types";

type Payload = {
  scores?: unknown;
};

export function parseVisualizationInput(body: unknown): VisualizationScores | null {
  if (!body || typeof body !== "object") return null;
  const payload = body as Payload;
  if (!Array.isArray(payload.scores)) return null;

  const normalized = payload.scores
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const company = (item as { company?: unknown }).company;
      const vision = (item as { vision?: unknown }).vision;
      const execution = (item as { execution?: unknown }).execution;
      const quadrant = (item as { quadrant?: unknown }).quadrant;
      if (
        typeof company !== "string" ||
        typeof vision !== "number" ||
        typeof execution !== "number" ||
        typeof quadrant !== "string"
      ) {
        return null;
      }
      return {
        company: company.trim(),
        vision,
        execution,
        quadrant: quadrant as VisualizationScores[number]["quadrant"],
      };
    })
    .filter(Boolean) as VisualizationScores;

  return normalized.length ? normalized : null;
}
