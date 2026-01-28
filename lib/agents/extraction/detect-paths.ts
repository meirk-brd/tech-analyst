import "server-only";

import type { ScrapeTargets } from "./types";

const PRICING_PATHS = [
  "/pricing",
  "/plans",
  "/pricing-plans",
  "/pricing/",
  "/plans/",
];

const DOCS_PATHS = [
  "/docs",
  "/documentation",
  "/developers",
  "/features",
  "/product",
  "/products",
  "/docs/",
  "/documentation/",
];

const ABOUT_PATHS = [
  "/about",
  "/about-us",
  "/company",
  "/who-we-are",
  "/about/",
  "/company/",
];

function normalizeBaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    return url.endsWith("/") ? url.slice(0, -1) : url;
  }
}

export function detectPaths(baseUrl: string): ScrapeTargets {
  const normalized = normalizeBaseUrl(baseUrl);
  return {
    pricing: PRICING_PATHS.map((path) => `${normalized}${path}`),
    docs: DOCS_PATHS.map((path) => `${normalized}${path}`),
    about: ABOUT_PATHS.map((path) => `${normalized}${path}`),
  };
}
