import "server-only";

import type { CompanyLead } from "./types";
import { logDiscovery } from "./logger";

type LeadScore = {
  lead: CompanyLead;
  count: number;
};

function normalizeKey(lead: CompanyLead): string {
  try {
    const url = new URL(lead.url);
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return lead.name.toLowerCase();
  }
}

export function dedupeCompanyLeads(leads: CompanyLead[], max = 30): CompanyLead[] {
  logDiscovery("lead.dedupe.start", { total: leads.length, max });
  const byKey = new Map<string, LeadScore>();

  for (const lead of leads) {
    const key = normalizeKey(lead);
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
      if (lead.snippet && !existing.lead.snippet) {
        existing.lead.snippet = lead.snippet;
      }
      if (!existing.lead.name && lead.name) {
        existing.lead.name = lead.name;
      }
      continue;
    }
    byKey.set(key, { lead: { ...lead }, count: 1 });
  }

  const deduped = Array.from(byKey.values())
    .sort((a, b) => b.count - a.count)
    .map((entry) => entry.lead)
    .slice(0, max);

  logDiscovery("lead.dedupe.done", { deduped: deduped.length });

  return deduped;
}
