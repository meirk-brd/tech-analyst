"use client";

import { useState, useCallback, useRef } from "react";
import { apiUrl } from "@/lib/base-path";
import type { AnalysisStatus, Visualizations } from "@/lib/agents/orchestration/types";
import type { ScoredCompany } from "@/lib/agents/synthesis/types";

export type LogType = "info" | "api" | "warn" | "done" | "action" | "error";

export type LogEntry = {
  id: string;
  type: LogType;
  message: string;
  timestamp: Date;
  progress?: number;
  total?: number;
  company?: string;
  substage?: string;
};

export type SubstageInfo = {
  substage: string;
  message: string;
  progress?: number;
  total?: number;
  company?: string;
};

export type AnalysisResult = {
  marketSector: string;
  scores: ScoredCompany[];
  csv: string;
  visualizations: Visualizations;
};

type SSEProgressEvent = {
  type: "progress";
  stage: AnalysisStatus;
  substage?: string;
  message: string;
  progress?: number;
  total?: number;
  company?: string;
};

type SSECompleteEvent = {
  type: "complete";
  result?: AnalysisResult;
};

type SSEErrorEvent = {
  type: "error";
  error: string;
};

type SSEEvent = SSEProgressEvent | SSECompleteEvent | SSEErrorEvent;

const STAGE_MESSAGES: Record<AnalysisStatus, { start: string; logType: LogType }> = {
  discovery: { start: "Discovering companies in market sector...", logType: "info" },
  enrichment: { start: "Enriching company data with Bright Data...", logType: "api" },
  extraction: { start: "Extracting competitive intelligence...", logType: "info" },
  synthesis: { start: "Synthesizing scores and rankings...", logType: "action" },
  visualization: { start: "Generating analysis charts...", logType: "action" },
  completed: { start: "Analysis complete!", logType: "done" },
  failed: { start: "Analysis failed", logType: "error" },
};

// Simulated progress messages for each stage to show detailed activity
const SIMULATED_PROGRESS: Record<AnalysisStatus, Array<{ type: LogType; message: string; delay: number }>> = {
  discovery: [
    { type: "action", message: "Generating search queries with AI...", delay: 800 },
    { type: "info", message: "Generated 5 targeted search queries", delay: 1500 },
    { type: "api", message: "Bright Data: Fetching page 1/3 of search results...", delay: 2200 },
    { type: "api", message: "Bright Data: Fetching page 2/3 of search results...", delay: 3500 },
    { type: "api", message: "Bright Data: Fetching page 3/3 of search results...", delay: 4800 },
    { type: "info", message: "Extracting company leads from search results...", delay: 5500 },
    { type: "action", message: "Deduplicating company leads...", delay: 6200 },
  ],
  enrichment: [
    { type: "info", message: "Validating company URLs...", delay: 500 },
    { type: "api", message: "Bright Data: Scraping company homepages (batch 1/3)...", delay: 1500 },
    { type: "api", message: "Bright Data: Scraping company homepages (batch 2/3)...", delay: 4000 },
    { type: "api", message: "Bright Data: Scraping company homepages (batch 3/3)...", delay: 6500 },
    { type: "action", message: "AI: Reflecting on scraped content...", delay: 8000 },
    { type: "info", message: "Extracting company mentions from pages...", delay: 9500 },
    { type: "action", message: "Deduplicating by domain...", delay: 10500 },
  ],
  extraction: [
    { type: "info", message: "Preparing extraction pipeline...", delay: 500 },
    { type: "api", message: "Bright Data: Fetching detailed company pages...", delay: 1500 },
    { type: "action", message: "AI: Extracting product features...", delay: 3000 },
    { type: "action", message: "AI: Extracting pricing information...", delay: 4500 },
    { type: "action", message: "AI: Analyzing competitive positioning...", delay: 6000 },
    { type: "info", message: "Validating extracted data...", delay: 7500 },
  ],
  synthesis: [
    { type: "action", message: "Calculating vision scores...", delay: 500 },
    { type: "action", message: "Calculating execution scores...", delay: 1200 },
    { type: "info", message: "Normalizing scores across companies...", delay: 1900 },
    { type: "action", message: "Assigning market quadrants...", delay: 2600 },
    { type: "info", message: "Generating CSV export data...", delay: 3300 },
  ],
  visualization: [
    { type: "action", message: "Preparing Magic Quadrant data...", delay: 400 },
    { type: "action", message: "Preparing Forrester Wave data...", delay: 800 },
    { type: "action", message: "Preparing GigaOm Radar data...", delay: 1200 },
    { type: "info", message: "Rendering chart components...", delay: 1600 },
  ],
  completed: [],
  failed: [],
};

export function useAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState<AnalysisStatus | null>(null);
  const [currentSubstage, setCurrentSubstage] = useState<SubstageInfo | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const simulationTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const lastSimulatedStageRef = useRef<AnalysisStatus | null>(null);

  const addLog = useCallback((
    type: LogType,
    message: string,
    options?: { progress?: number; total?: number; company?: string; substage?: string }
  ) => {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: new Date(),
      progress: options?.progress,
      total: options?.total,
      company: options?.company,
      substage: options?.substage,
    };
    setLogs((prev) => [...prev, entry]);
  }, []);

  // Clear all simulation timeouts
  const clearSimulationTimeouts = useCallback(() => {
    simulationTimeoutsRef.current.forEach(clearTimeout);
    simulationTimeoutsRef.current = [];
  }, []);

  // Start simulated progress for a stage
  const startSimulatedProgress = useCallback((stage: AnalysisStatus) => {
    // Don't re-simulate the same stage
    if (lastSimulatedStageRef.current === stage) return;
    lastSimulatedStageRef.current = stage;

    const messages = SIMULATED_PROGRESS[stage];
    if (!messages || messages.length === 0) return;

    messages.forEach(({ type, message, delay }) => {
      const timeout = setTimeout(() => {
        addLog(type, message);
      }, delay);
      simulationTimeoutsRef.current.push(timeout);
    });
  }, [addLog]);

  const reset = useCallback(() => {
    clearSimulationTimeouts();
    lastSimulatedStageRef.current = null;
    setLogs([]);
    setResult(null);
    setError(null);
    setCurrentStage(null);
    setCurrentSubstage(null);
  }, [clearSimulationTimeouts]);

  const startAnalysis = useCallback(
    async (marketSector: string) => {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      reset();
      setIsLoading(true);
      abortControllerRef.current = new AbortController();

      addLog("info", `Initializing analysis for "${marketSector}"...`);
      addLog("api", "POST /api/agents/orchestrator?stream=true");

      try {
        const response = await fetch(apiUrl("/api/agents/orchestrator?stream=true"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({ marketSector }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          if (response.status === 429) {
            const data = await response.json();
            if (data.error === "RATE_LIMITED") {
              setIsRateLimited(true);
              setIsLoading(false);
              return;
            }
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event: SSEEvent = JSON.parse(line.slice(6));

                if (event.type === "progress") {
                  const stageInfo = STAGE_MESSAGES[event.stage];
                  setCurrentStage(event.stage);

                  // Update substage info for the progress stepper
                  if (event.substage) {
                    setCurrentSubstage({
                      substage: event.substage,
                      message: event.message,
                      progress: event.progress,
                      total: event.total,
                      company: event.company,
                    });
                  } else {
                    // Clear substage when stage completes (no substage = stage completion event)
                    setCurrentSubstage(null);
                  }

                  // Determine log type based on substage
                  let logType = stageInfo?.logType || "info";
                  if (event.substage === "searching" || event.substage === "scraping") {
                    logType = "api";
                  } else if (event.substage === "reflecting" || event.substage === "extracting") {
                    logType = "action";
                  }

                  addLog(logType, event.message, {
                    progress: event.progress,
                    total: event.total,
                    company: event.company,
                    substage: event.substage,
                  });

                  // Only start simulated progress if no substage (legacy behavior for fallback)
                  if (!event.substage) {
                    startSimulatedProgress(event.stage);
                  }
                } else if (event.type === "complete") {
                  clearSimulationTimeouts();
                  setCurrentStage("completed");
                  addLog("done", "Analysis completed successfully!");
                  if (event.result) {
                    setResult(event.result);
                  }
                } else if (event.type === "error") {
                  clearSimulationTimeouts();
                  setCurrentStage("failed");
                  addLog("error", event.error);
                  setError(event.error);
                }
              } catch (parseError) {
                console.error("Failed to parse SSE event:", parseError);
              }
            }
          }
        }
      } catch (err) {
        clearSimulationTimeouts();
        if (err instanceof Error && err.name === "AbortError") {
          addLog("warn", "Analysis cancelled");
        } else {
          const message = err instanceof Error ? err.message : "Unknown error";
          setError(message);
          addLog("error", message);
          setCurrentStage("failed");
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [addLog, reset, startSimulatedProgress, clearSimulationTimeouts]
  );

  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    currentStage,
    currentSubstage,
    logs,
    result,
    error,
    isRateLimited,
    setIsRateLimited,
    startAnalysis,
    cancelAnalysis,
    reset,
  };
}
