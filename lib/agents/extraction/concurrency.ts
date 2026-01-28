import "server-only";

const DEFAULT_MAX_CONCURRENCY = 20;

export function getExtractionMaxConcurrency(): number {
  const raw = process.env.EXTRACTION_MAX_CONCURRENCY;
  if (!raw) return DEFAULT_MAX_CONCURRENCY;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MAX_CONCURRENCY;

  return Math.floor(parsed);
}
