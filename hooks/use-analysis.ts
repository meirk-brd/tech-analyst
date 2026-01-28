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
  message: string;
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

export function useAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState<AnalysisStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const addLog = useCallback((type: LogType, message: string) => {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: new Date(),
    };
    setLogs((prev) => [...prev, entry]);
  }, []);

  const reset = useCallback(() => {
    setLogs([]);
    setResult(null);
    setError(null);
    setCurrentStage(null);
  }, []);

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
                  addLog(stageInfo?.logType || "info", event.message);
                } else if (event.type === "complete") {
                  setCurrentStage("completed");
                  addLog("done", "Analysis completed successfully!");
                  if (event.result) {
                    setResult(event.result);
                  }
                } else if (event.type === "error") {
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
    [addLog, reset]
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
