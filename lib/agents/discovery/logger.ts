import "server-only";

const DEBUG_ENABLED =
  process.env.DISCOVERY_DEBUG === "1" || process.env.DISCOVERY_DEBUG === "true";

export function logDiscovery(message: string, meta?: Record<string, unknown>) {
  if (!DEBUG_ENABLED) return;
  if (meta) {
    console.log(`[discovery] ${message}`, meta);
  } else {
    console.log(`[discovery] ${message}`);
  }
}
