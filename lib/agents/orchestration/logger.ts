import "server-only";

const DEBUG_ENABLED =
  process.env.ORCHESTRATION_DEBUG === "1" ||
  process.env.ORCHESTRATION_DEBUG === "true";

export function logOrchestration(message: string, meta?: Record<string, unknown>) {
  if (!DEBUG_ENABLED) return;
  if (meta) {
    console.log(`[orchestration] ${message}`, meta);
  } else {
    console.log(`[orchestration] ${message}`);
  }
}
