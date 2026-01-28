import "server-only";

import type { ScoredCompany } from "./types";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

export function generateCsv(scores: ScoredCompany[]): string {
  const headers = [
    "Company",
    "Website",
    "Business Model",
    "Key Features",
    "Vision Score",
    "Execution Score",
    "Quadrant",
  ];

  const rows = scores.map((score) => {
    const keyFeatures = score.raw.keyFeatures?.join("; ") ?? "";
    return [
      score.company,
      score.url,
      score.raw.businessModel || "Unknown",
      keyFeatures,
      String(score.vision),
      String(score.execution),
      score.quadrant,
    ].map(escapeCsv);
  });

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}
