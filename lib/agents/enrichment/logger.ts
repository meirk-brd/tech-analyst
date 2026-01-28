const DEBUG = process.env.ENRICHMENT_DEBUG === "true";

export function logEnrichment(event: string, data?: Record<string, unknown>) {
  if (!DEBUG) return;
  console.log(`[enrichment] ${event}`, data ? JSON.stringify(data) : "");
}
