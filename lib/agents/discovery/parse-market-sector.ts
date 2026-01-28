import "server-only";

export function parseMarketSector(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const sector = (body as { marketSector?: unknown }).marketSector;
  if (typeof sector !== "string") return null;
  const trimmed = sector.trim();
  return trimmed.length ? trimmed : null;
}
