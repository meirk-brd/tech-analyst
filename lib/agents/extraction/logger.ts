import "server-only";

const DEBUG_ENABLED =
  process.env.EXTRACTION_DEBUG === "1" || process.env.EXTRACTION_DEBUG === "true";

export function logExtraction(message: string, meta?: Record<string, unknown>) {
  if (!DEBUG_ENABLED) return;
  if (meta) {
    console.log(`[extraction] ${message}`, meta);
  } else {
    console.log(`[extraction] ${message}`);
  }
}
