import "server-only";

import type { CompanyLead, SearchRunResult } from "./types";
import { logDiscovery } from "./logger";

type SearchItem = Record<string, unknown>;

function normalizeUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function nameFromUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    const host = url.hostname.replace(/^www\./, "");
    const base = host.split(".")[0] || host;
    return base.replace(/[-_]/g, " ").trim();
  } catch {
    return urlString;
  }
}

function pickString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  return undefined;
}

function extractItems(raw: unknown): SearchItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as SearchItem[];

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return extractItems(parsed);
      } catch {
        return [];
      }
    }
    return [];
  }

  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const candidates = [
      "results",
      "organic",
      "items",
      "data",
      "search_results",
      "result",
    ];
    for (const key of candidates) {
      const value = obj[key];
      if (Array.isArray(value)) return value as SearchItem[];
    }
  }

  return [];
}

function extractText(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const candidates = ["result", "content", "text", "markdown"];
    for (const key of candidates) {
      const value = obj[key];
      if (typeof value === "string") return value;
    }
  }
  return null;
}

function extractFromItem(item: SearchItem, sourceQuery: string): CompanyLead | null {
  const title =
    pickString(item.title) ||
    pickString(item.name) ||
    pickString(item.company) ||
    pickString(item.result_title);

  const urlCandidate =
    pickString(item.url) ||
    pickString(item.link) ||
    pickString(item.href) ||
    pickString(item.website);

  const url = urlCandidate ? normalizeUrl(urlCandidate) : null;
  if (!url) return null;

  const snippet =
    pickString(item.snippet) ||
    pickString(item.description) ||
    pickString(item.content) ||
    pickString(item.excerpt);

  const cleanedName = title
    ? title.split(" - ")[0].split(" | ")[0].trim()
    : nameFromUrl(url);

  if (!cleanedName) return null;

  return {
    name: cleanedName,
    url,
    snippet,
    sourceQuery,
  };
}

export function extractCompanyLeads(results: SearchRunResult[]): CompanyLead[] {
  const leads: CompanyLead[] = [];
  let totalItems = 0;
  let fallbackUrls = 0;

  for (const result of results) {
    if (!result.raw) continue;

    const items = extractItems(result.raw);
    totalItems += items.length;
    for (const item of items) {
      const lead = extractFromItem(item, result.query);
      if (lead) leads.push(lead);
    }

    const text = extractText(result.raw);
    if (text) {
      const urls = text.match(/https?:\/\/[^\s)]+/g) ?? [];
      fallbackUrls += urls.length;
      for (const url of urls) {
        const normalized = normalizeUrl(url);
        if (!normalized) continue;
        leads.push({
          name: nameFromUrl(normalized),
          url: normalized,
          sourceQuery: result.query,
        });
      }
    }
  }

  logDiscovery("lead.extracted", {
    rawResults: results.length,
    totalItems,
    fallbackUrls,
    leads: leads.length,
  });

  return leads;
}
