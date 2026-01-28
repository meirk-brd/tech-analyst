import "server-only";

const DEBUG_ENABLED =
  process.env.SYNTHESIS_DEBUG === "1" || process.env.SYNTHESIS_DEBUG === "true";

export function logSynthesis(message: string, meta?: Record<string, unknown>) {
  if (!DEBUG_ENABLED) return;
  if (meta) {
    console.log(`[synthesis] ${message}`, meta);
  } else {
    console.log(`[synthesis] ${message}`);
  }
}
