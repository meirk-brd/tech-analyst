import "server-only";

export type ProgressSubstage =
  | "queries"
  | "searching"
  | "extracting"
  | "deduplicating"
  | "scraping"
  | "reflecting"
  | "aggregating"
  | "scoring"
  | "normalizing"
  | "charts";

export type ProgressEvent = {
  stage: "discovery" | "enrichment" | "extraction" | "synthesis" | "visualization";
  substage: ProgressSubstage;
  message: string;
  progress?: number;
  total?: number;
  company?: string;
};

export type ProgressCallback = (event: ProgressEvent) => void;

/**
 * Simple progress emitter for passing progress callbacks through the analysis pipeline.
 * This allows nodes to emit granular progress events that get forwarded to SSE clients.
 */
export class ProgressEmitter {
  private callback: ProgressCallback | null = null;

  setCallback(callback: ProgressCallback) {
    this.callback = callback;
  }

  emit(event: ProgressEvent) {
    this.callback?.(event);
  }

  clear() {
    this.callback = null;
  }
}

// Global emitter instance for the current request
// Note: This is safe because each request runs in its own context in serverless
let currentEmitter: ProgressEmitter | null = null;

export function createProgressEmitter(): ProgressEmitter {
  currentEmitter = new ProgressEmitter();
  return currentEmitter;
}

export function getProgressEmitter(): ProgressEmitter | null {
  return currentEmitter;
}

export function clearProgressEmitter() {
  currentEmitter?.clear();
  currentEmitter = null;
}
