import "server-only";

import type { CompanyInput } from "./types";

export function parseCompanies(body: unknown): CompanyInput[] | null {
  if (!body || typeof body !== "object") return null;
  const companies = (body as { companies?: unknown }).companies;
  if (!Array.isArray(companies)) return null;

  const normalized = companies
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const name = (item as { name?: unknown }).name;
      const url = (item as { url?: unknown }).url;
      if (typeof name !== "string" || typeof url !== "string") return null;
      const trimmedName = name.trim();
      const trimmedUrl = url.trim();
      if (!trimmedName || !trimmedUrl) return null;
      return { name: trimmedName, url: trimmedUrl };
    })
    .filter(Boolean) as CompanyInput[];

  return normalized.length ? normalized : null;
}
