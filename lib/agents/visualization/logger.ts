import "server-only";

const DEBUG_ENABLED =
  process.env.VISUALIZATION_DEBUG === "1" ||
  process.env.VISUALIZATION_DEBUG === "true";

export function logVisualization(message: string, meta?: Record<string, unknown>) {
  if (!DEBUG_ENABLED) return;
  if (meta) {
    console.log(`[visualization] ${message}`, meta);
  } else {
    console.log(`[visualization] ${message}`);
  }
}
