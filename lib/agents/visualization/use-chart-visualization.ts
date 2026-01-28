"use client";

/**
 * Client-side hook for chart visualization
 * Fetches chart data from the API and provides rendering/export capabilities
 */

import { useState, useCallback } from "react";
import { apiUrl } from "@/lib/base-path";
import type { VisualizationScores, ImageResult } from "./types";
import type { ChartDataResult, GenerateChartDataOptions } from "./generate-chart-data";

export type ChartVisualizationState = {
  loading: boolean;
  error: string | null;
  chartData: ChartDataResult | null;
  images: {
    quadrant: ImageResult | null;
    wave: ImageResult | null;
    radar: ImageResult | null;
  };
};

export type UseChartVisualizationReturn = {
  state: ChartVisualizationState;
  fetchChartData: (scores: VisualizationScores, options?: GenerateChartDataOptions) => Promise<ChartDataResult | null>;
  setImageResult: (type: "quadrant" | "wave" | "radar", result: ImageResult) => void;
  reset: () => void;
};

const initialState: ChartVisualizationState = {
  loading: false,
  error: null,
  chartData: null,
  images: {
    quadrant: null,
    wave: null,
    radar: null,
  },
};

/**
 * Hook for managing chart visualization state and fetching chart data
 */
export function useChartVisualization(): UseChartVisualizationReturn {
  const [state, setState] = useState<ChartVisualizationState>(initialState);

  const fetchChartData = useCallback(
    async (
      scores: VisualizationScores,
      options?: GenerateChartDataOptions
    ): Promise<ChartDataResult | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(apiUrl("/api/agents/visualization/charts"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scores, options }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const chartData: ChartDataResult = await response.json();

        setState((prev) => ({
          ...prev,
          loading: false,
          chartData,
        }));

        return chartData;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch chart data";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
        return null;
      }
    },
    []
  );

  const setImageResult = useCallback(
    (type: "quadrant" | "wave" | "radar", result: ImageResult) => {
      setState((prev) => ({
        ...prev,
        images: {
          ...prev.images,
          [type]: result,
        },
      }));
    },
    []
  );

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    fetchChartData,
    setImageResult,
    reset,
  };
}
