import "server-only";

/**
 * @deprecated These prompts are for AI-based image generation via Google Gemini.
 * They are kept for backward compatibility but are being replaced by Recharts-based
 * programmatic chart rendering. Recharts is default; set USE_RECHARTS=false to use AI.
 *
 * New implementation: ./generate-chart-data.ts + ./transform-scores.ts
 * See: components/charts/ for the new chart components
 */

import type { VisualizationScores } from "./types";

function clamp(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(Math.round(value), 0), 100);
}

function formatPoints(scores: VisualizationScores): string {
  return scores
    .map(
      (score) =>
        `- ${score.company}: (${clamp(score.vision)}, ${clamp(score.execution)})`
    )
    .join("\n");
}

function formatWaveBars(scores: VisualizationScores): string {
  return scores
    .map((score) => {
      const currentOffering = clamp(score.execution);
      const strategy = clamp(score.vision);
      const marketPresence = clamp((currentOffering + strategy) / 2);
      return `- ${score.company}: current=${currentOffering}, strategy=${strategy}, market=${marketPresence}`;
    })
    .join("\n");
}

function formatRadar(scores: VisualizationScores): string {
  return scores
    .map((score) => {
      const innovation = clamp(score.vision);
      const execution = clamp(score.execution);
      const marketPresence = clamp((innovation + execution) / 2);
      const customerTrust = clamp((execution * 0.7 + innovation * 0.3));
      const integrationBreadth = clamp((innovation * 0.6 + execution * 0.4));
      return `- ${score.company}: innovation=${innovation}, execution=${execution}, market=${marketPresence}, trust=${customerTrust}, integrations=${integrationBreadth}`;
    })
    .join("\n");
}

export function buildMagicQuadrantPrompt(scores: VisualizationScores): string {
  return [
    "Create a professional Gartner-style Magic Quadrant chart.",
    "Axes:",
    '- X-axis: "Completeness of Vision" (0-100)',
    '- Y-axis: "Ability to Execute" (0-100)',
    "Quadrants labeled: Leaders, Challengers, Visionaries, Niche Players.",
    "Plot each company as a labeled circle at its coordinates.",
    "Use a clean, minimalist style with readable text.",
    "Light background, subtle gridlines, corporate blue/gray palette.",
    "Data points:",
    formatPoints(scores),
  ].join("\n");
}

export function buildForresterWavePrompt(scores: VisualizationScores): string {
  return [
    "Create a Forrester Wave style chart as a stacked bar chart.",
    "For each company, show three stacked segments:",
    '- "Current Offering", "Strategy", "Market Presence" (0-100 scale).',
    "Sort companies by total score descending.",
    "Use consistent colors and include a legend.",
    "Keep labels readable and avoid clutter.",
    "Data:",
    formatWaveBars(scores),
  ].join("\n");
}

export function buildGigaOmRadarPrompt(scores: VisualizationScores): string {
  return [
    "Create a GigaOm Radar style chart (radar/spider chart).",
    "Axes: Innovation, Execution, Market Presence, Customer Trust, Integration Breadth.",
    "Plot each company as a distinct colored polygon with labels.",
    "Use a clean, professional style with readable text.",
    "Data:",
    formatRadar(scores),
  ].join("\n");
}
