import type { CompanyLead } from "../discovery/types";

/**
 * Normalize a URL to its homepage (remove path, keep subdomain).
 * Example: https://www.anthropic.com/research → https://www.anthropic.com
 */
export function normalizeToHomepage(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return url;
  }
}

/**
 * Extract root domain from hostname (e.g., cloud.zilliz.com → zilliz.com).
 * Handles common TLDs like .com, .io, .ai, .co.uk, etc.
 */
function getRootDomain(hostname: string): string {
  const parts = hostname.replace(/^www\./, "").toLowerCase().split(".");

  // Handle two-part TLDs like .co.uk, .com.au
  const twoPartTlds = ["co.uk", "com.au", "co.nz", "co.jp", "com.br"];
  if (parts.length >= 3) {
    const lastTwo = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    if (twoPartTlds.includes(lastTwo)) {
      return parts.slice(-3).join(".");
    }
  }

  // Standard case: return last two parts (domain.tld)
  if (parts.length >= 2) {
    return parts.slice(-2).join(".");
  }

  return parts.join(".");
}

/**
 * Dedupe companies by root domain, preferring non-subdomain URLs.
 * Example: keeps zilliz.com over cloud.zilliz.com
 */
export function dedupeByDomain(companies: CompanyLead[]): CompanyLead[] {
  const byDomain = new Map<string, CompanyLead>();

  for (const company of companies) {
    try {
      const hostname = new URL(company.url).hostname.replace(/^www\./, "").toLowerCase();
      const rootDomain = getRootDomain(hostname);
      const isSubdomain = hostname !== rootDomain;

      const existing = byDomain.get(rootDomain);
      if (!existing) {
        // First occurrence of this domain
        byDomain.set(rootDomain, company);
      } else {
        // Prefer non-subdomain URL over subdomain
        const existingHostname = new URL(existing.url).hostname.replace(/^www\./, "").toLowerCase();
        const existingIsSubdomain = existingHostname !== rootDomain;

        if (existingIsSubdomain && !isSubdomain) {
          // Replace subdomain URL with root domain URL
          byDomain.set(rootDomain, company);
        }
      }
    } catch {
      // Skip invalid URLs
    }
  }

  return Array.from(byDomain.values());
}

/**
 * Domains that should be skipped entirely (no useful company data).
 */
const SKIP_DOMAINS = [
  "youtube.com",
  "youtu.be",
  "reddit.com",
  "quora.com",
  "twitter.com",
  "x.com",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "linkedin.com",
];

/**
 * Check if a URL should be skipped (social media, video platforms, etc.).
 */
export function shouldSkipUrl(url: string): boolean {
  try {
    const domain = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return SKIP_DOMAINS.some((skip) => domain.includes(skip));
  } catch {
    return true;
  }
}
