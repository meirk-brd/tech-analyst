"use client";

import { useState, useCallback } from "react";
import { apiUrl } from "@/lib/base-path";
import type { AnalysisResult } from "./use-analysis";
import type { ChartDataResult } from "@/lib/agents/visualization/generate-chart-data";

type SessionResponse = {
  id: string;
  marketSector: string;
  status: "completed" | "failed";
  result?: {
    scores?: unknown[];
    visualizations?: {
      quadrant: string;
      wave: string;
      radar: string;
      chartData?: ChartDataResult;
    };
    csv?: string;
  };
  createdAt: string;
  updatedAt: string;
};

function dataUrlToImageResult(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  return {
    mimeType: match?.[1] ?? "image/png",
    base64: match?.[2] ?? "",
    dataUrl,
  };
}

export function useSessionLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async (id: string): Promise<AnalysisResult | null> => {
    setIsLoading(true);
    setError(null);
    setSession(null);

    try {
      const response = await fetch(apiUrl(`/api/sessions/${id}`));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Session not found");
        }
        throw new Error(`Failed to load session: ${response.status}`);
      }

      const data: SessionResponse = await response.json();

      if (data.status === "failed") {
        throw new Error("This session failed and has no results");
      }

      const vis = data.result?.visualizations;
      const result: AnalysisResult = {
        marketSector: data.marketSector,
        scores: (data.result?.scores ?? []) as AnalysisResult["scores"],
        csv: data.result?.csv ?? "",
        visualizations: {
          quadrant: dataUrlToImageResult(vis?.quadrant ?? ""),
          wave: dataUrlToImageResult(vis?.wave ?? ""),
          radar: dataUrlToImageResult(vis?.radar ?? ""),
          chartData: vis?.chartData,
        },
      };

      setSession(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setSession(null);
    setError(null);
  }, []);

  return {
    loadSession,
    isLoading,
    session,
    error,
    clear,
  };
}
