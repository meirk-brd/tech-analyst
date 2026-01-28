"use client";

/**
 * ChartExporter - Renders a chart and exports it to PNG
 * This component handles the rendering and export flow for all chart types.
 */

import { useRef, useEffect, useCallback } from "react";
import { MagicQuadrantChart } from "./MagicQuadrantChart";
import { ForresterWaveChart } from "./ForresterWaveChart";
import { GigaOmRadarChart } from "./GigaOmRadarChart";
import { exportToPng, type ChartType, type ExportOptions } from "@/lib/agents/visualization/export-chart";
import type { QuadrantDataPoint, WaveDataPoint, RadarDataPoint } from "@/lib/agents/visualization/chart-types";
import type { ImageResult } from "@/lib/agents/visualization/types";

type ChartData = QuadrantDataPoint[] | WaveDataPoint[] | RadarDataPoint[];

export type ChartExporterProps = {
  chartType: ChartType;
  data: ChartData;
  title?: string;
  subtitle?: string;
  category?: string;
  dimensions?: { width: number; height: number };
  exportOptions?: ExportOptions;
  onExportComplete?: (result: ImageResult) => void;
  onExportError?: (error: Error) => void;
  /** If true, automatically exports on mount */
  autoExport?: boolean;
  /** If true, hides the chart after export (for headless rendering) */
  hideAfterExport?: boolean;
};

export function ChartExporter({
  chartType,
  data,
  title,
  subtitle,
  category,
  dimensions = { width: 800, height: 700 },
  exportOptions,
  onExportComplete,
  onExportError,
  autoExport = false,
  hideAfterExport = false,
}: ChartExporterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasExported = useRef(false);

  const handleExport = useCallback(async () => {
    if (!containerRef.current) {
      onExportError?.(new Error("Chart container not found"));
      return;
    }

    try {
      const result = await exportToPng(containerRef.current, exportOptions);
      onExportComplete?.(result);

      if (hideAfterExport && containerRef.current) {
        containerRef.current.style.display = "none";
      }
    } catch (error) {
      onExportError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }, [exportOptions, onExportComplete, onExportError, hideAfterExport]);

  useEffect(() => {
    if (autoExport && !hasExported.current) {
      // Wait for the chart to fully render
      const timer = setTimeout(() => {
        hasExported.current = true;
        handleExport();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [autoExport, handleExport]);

  const renderChart = () => {
    switch (chartType) {
      case "magic-quadrant":
        return (
          <MagicQuadrantChart
            data={data as QuadrantDataPoint[]}
            title={title || "Magic Quadrant"}
            dimensions={dimensions}
          />
        );

      case "forrester-wave":
        return (
          <ForresterWaveChart
            data={data as WaveDataPoint[]}
            subtitle={subtitle || category || "Analysis"}
            dimensions={dimensions}
          />
        );

      case "gigaom-radar":
        return (
          <GigaOmRadarChart
            data={data as RadarDataPoint[]}
            category={category || subtitle || "Analysis"}
            dimensions={dimensions}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: "inline-block",
        backgroundColor: "#FFFFFF",
        padding: "16px",
      }}
    >
      {renderChart()}
    </div>
  );
}

/**
 * Hook for imperatively exporting a chart
 */
export function useChartExport() {
  const containerRef = useRef<HTMLDivElement>(null);

  const exportChart = useCallback(async (options?: ExportOptions): Promise<ImageResult> => {
    if (!containerRef.current) {
      throw new Error("Chart container not mounted");
    }

    return exportToPng(containerRef.current, options);
  }, []);

  return { containerRef, exportChart };
}
