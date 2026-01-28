import "server-only";

import type { ExtractedCompanyData } from "@/lib/agents/extraction/types";
import type { ScoredCompany, ScoreBreakdown } from "./types";

const CURRENT_YEAR = new Date().getFullYear();

function clamp(value: number, min = 0, max = 100): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function normalizeText(value?: string | null): string {
  return (value || "").toLowerCase();
}

function containsAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}

export function scoreFeatureDepth(features: string[] = []): number {
  const count = features.length;
  let score = 10;
  if (count === 0) score = 15;
  else if (count <= 2) score = 30;
  else if (count <= 4) score = 50;
  else if (count <= 7) score = 70;
  else if (count <= 10) score = 85;
  else score = 95;

  const hasDetail = features.some((feature) => feature.length >= 80);
  if (hasDetail) score += 5;

  return clamp(score);
}

export function scoreInnovation(capabilities: ExtractedCompanyData["technicalCapabilities"]): number {
  const integrations = capabilities?.integrations ?? [];
  const scalability = normalizeText(capabilities?.scalability || "");
  const security = normalizeText(capabilities?.security || "");

  let score = 40;
  if (scalability.length > 40) score += 10;
  if (containsAny(scalability, ["million", "billion", "high qps", "low latency"])) {
    score += 15;
  }
  if (containsAny(security, ["soc", "iso", "hipaa", "gdpr", "pci"])) {
    score += 10;
  }

  score += Math.min(integrations.length * 2, 20);

  return clamp(score);
}

export function scorePositioning(businessModel: string): number {
  const model = normalizeText(businessModel);
  if (model.includes("managed")) return 80;
  if (model.includes("saas")) return 75;
  if (model.includes("freemium")) return 70;
  if (model.includes("open source")) return 65;
  if (model.includes("license")) return 55;
  return 45;
}

export function scorePricingMaturity(pricingTiers: string[] = []): number {
  const tiers = pricingTiers.map((tier) => tier.toLowerCase());
  const count = tiers.length;

  let score = 20;
  if (count === 0) score = 25;
  else if (count === 1) score = 40;
  else if (count === 2) score = 55;
  else if (count === 3) score = 70;
  else if (count >= 4) score = 80;

  if (tiers.some((tier) => tier.includes("enterprise"))) score += 10;
  if (tiers.some((tier) => tier.includes("free"))) score += 5;

  return clamp(score);
}

const ENTERPRISE_NAMES = [
  "microsoft",
  "google",
  "amazon",
  "aws",
  "meta",
  "apple",
  "ibm",
  "oracle",
  "salesforce",
  "sap",
  "netflix",
  "uber",
  "snowflake",
  "databricks",
];

export function scoreEnterprisePresence(customers: string[] = []): number {
  const count = customers.length;
  let score = 20;
  if (count === 0) score = 20;
  else if (count <= 2) score = 40;
  else if (count <= 5) score = 55;
  else if (count <= 10) score = 70;
  else if (count <= 20) score = 80;
  else score = 90;

  const hasEnterprise = customers.some((name) =>
    ENTERPRISE_NAMES.some((enterprise) => normalizeText(name).includes(enterprise))
  );
  if (hasEnterprise) score += 10;

  return clamp(score);
}

export function scoreDocumentationQuality(
  capabilities: ExtractedCompanyData["technicalCapabilities"],
  keyFeatures: string[] = [],
  docsAvailable: boolean
): number {
  let score = docsAvailable ? 40 : 20;
  const integrations = capabilities?.integrations ?? [];
  score += Math.min(integrations.length * 2, 20);
  score += Math.min(keyFeatures.length * 2, 20);
  return clamp(score);
}

export function scoreViability(foundingYear?: number | null): number {
  if (!foundingYear || Number.isNaN(foundingYear)) return 50;
  const age = Math.max(0, CURRENT_YEAR - foundingYear);
  if (age <= 1) return 35;
  if (age <= 3) return 50;
  if (age <= 5) return 65;
  if (age <= 8) return 80;
  if (age <= 12) return 90;
  return 95;
}

function determineQuadrant(
  vision: number,
  execution: number,
  threshold: number
): ScoredCompany["quadrant"] {
  if (vision >= threshold && execution >= threshold) return "Leaders";
  if (vision < threshold && execution >= threshold) return "Challengers";
  if (vision >= threshold && execution < threshold) return "Visionaries";
  return "Niche Players";
}

function median(values: number[]): number {
  if (values.length === 0) return 50;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function normalizeScores(scores: number[]): number[] {
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return scores;
  if (max - min < 10) return scores;
  return scores.map((score) => ((score - min) / (max - min)) * 100);
}

export function calculateScores(
  data: ExtractedCompanyData[],
  options: { normalize?: boolean } = {}
): ScoredCompany[] {
  const normalize = options.normalize ?? true;

  const interim = data.map((company) => {
    const breakdown: ScoreBreakdown = {
      featureDepth: scoreFeatureDepth(company.keyFeatures),
      innovation: scoreInnovation(company.technicalCapabilities),
      positioning: scorePositioning(company.businessModel),
      pricingMaturity: scorePricingMaturity(company.pricingTiers),
      enterprisePresence: scoreEnterprisePresence(company.enterpriseCustomers),
      documentationQuality: scoreDocumentationQuality(
        company.technicalCapabilities,
        company.keyFeatures,
        Boolean(company.sources?.docs)
      ),
      viability: scoreViability(company.foundingYear),
    };

    const vision =
      breakdown.featureDepth * 0.4 +
      breakdown.innovation * 0.3 +
      breakdown.positioning * 0.3;

    const execution =
      breakdown.pricingMaturity * 0.3 +
      breakdown.enterprisePresence * 0.25 +
      breakdown.documentationQuality * 0.2 +
      breakdown.viability * 0.25;

    return {
      company: company.company,
      url: company.url,
      vision,
      execution,
      breakdown,
      raw: company,
    };
  });

  const visionScores = interim.map((item) => item.vision);
  const executionScores = interim.map((item) => item.execution);
  const normalizedVision = normalize ? normalizeScores(visionScores) : visionScores;
  const normalizedExecution = normalize ? normalizeScores(executionScores) : executionScores;

  const threshold = median(
    normalize ? normalizedVision.concat(normalizedExecution) : visionScores.concat(executionScores)
  );

  return interim.map((item, index) => {
    const vision = clamp(Math.round(normalizedVision[index]));
    const execution = clamp(Math.round(normalizedExecution[index]));
    return {
      company: item.company,
      url: item.url,
      vision,
      execution,
      quadrant: determineQuadrant(vision, execution, threshold),
      breakdown: {
        featureDepth: clamp(Math.round(item.breakdown.featureDepth)),
        innovation: clamp(Math.round(item.breakdown.innovation)),
        positioning: clamp(Math.round(item.breakdown.positioning)),
        pricingMaturity: clamp(Math.round(item.breakdown.pricingMaturity)),
        enterprisePresence: clamp(Math.round(item.breakdown.enterprisePresence)),
        documentationQuality: clamp(Math.round(item.breakdown.documentationQuality)),
        viability: clamp(Math.round(item.breakdown.viability)),
      },
      raw: item.raw,
    };
  });
}
