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

type PyramidTier = {
  name: string;
  companies: string[];
};

function categorizeToPyramidTiers(scores: VisualizationScores): PyramidTier[] {
  // Sort by combined score (vision + execution)
  const sorted = [...scores].sort(
    (a, b) => (b.vision + b.execution) - (a.vision + a.execution)
  );

  // Categorize into 3 tiers based on quadrant and scores
  const topNotch: string[] = [];
  const established: string[] = [];
  const grounded: string[] = [];

  for (const score of sorted) {
    const combined = score.vision + score.execution;

    // Top Notch Startups: Leaders with high combined scores (innovative, high potential)
    if (score.quadrant === "Leaders" || (score.quadrant === "Visionaries" && combined >= 140)) {
      topNotch.push(score.company);
    }
    // Established Companies: Challengers or high-performing Visionaries/Niche Players
    else if (score.quadrant === "Challengers" || (score.quadrant === "Visionaries" && combined >= 100)) {
      established.push(score.company);
    }
    // Grounded Enterprises: Niche Players and others
    else {
      grounded.push(score.company);
    }
  }

  return [
    { name: "Top Notch Startups", companies: topNotch },
    { name: "Established Companies", companies: established },
    { name: "Grounded Enterprises", companies: grounded },
  ];
}

function formatPyramidTiers(tiers: PyramidTier[]): string {
  return tiers
    .map((tier) => {
      const companies = tier.companies.length > 0
        ? tier.companies.join(", ")
        : "(none)";
      return `- ${tier.name}: ${companies}`;
    })
    .join("\n");
}

export function buildPyramidPrompt(scores: VisualizationScores, marketSector?: string): string {
  const tiers = categorizeToPyramidTiers(scores);
  const title = marketSector ? `${marketSector} Market Pyramid` : "Market Analysis Pyramid";

  return [
    `Create a professional 3-tier pyramid infographic titled "${title}".`,
    "",
    "Visual Design Requirements:",
    "- The pyramid should be a classic triangle shape divided into 3 horizontal tiers",
    "- Use a dark, modern color scheme with gradient fills:",
    "  - Top tier (smallest): Gold/amber gradient (#F59E0B to #D97706) - represents elite, top performers",
    "  - Middle tier: Electric blue gradient (#3B82F6 to #1D4ED8) - represents established players",
    "  - Bottom tier (largest): Deep purple/indigo gradient (#6366F1 to #4338CA) - represents foundation/grounded players",
    "- Add subtle glow effects around each tier",
    "- Use a dark background (#0F172A or similar) for modern tech aesthetic",
    "- White or light gray text for company names",
    "",
    "Layout:",
    "- Top tier (peak): smallest width, labeled 'TOP NOTCH STARTUPS' with company names inside",
    "- Middle tier: medium width, labeled 'ESTABLISHED COMPANIES' with company names inside",
    "- Bottom tier (base): largest width, labeled 'GROUNDED ENTERPRISES' with company names inside",
    "",
    "Tier Labels should be bold, positioned at the left edge of each tier.",
    "Company names should be listed inside each tier, centered or distributed evenly.",
    "Add a subtle 3D effect or shadow to give depth to the pyramid.",
    "",
    "Data to display:",
    formatPyramidTiers(tiers),
  ].join("\n");
}
