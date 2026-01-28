"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Download, Maximize2 } from "lucide-react";
import { MagicQuadrantChart, ForresterWaveChart, GigaOmRadarChart } from "@/components/charts";
import { exportToPng } from "@/lib/agents/visualization/export-chart";
import type { ImageResult } from "@/lib/agents/visualization/types";
import type { QuadrantDataPoint, WaveDataPoint, RadarDataPoint } from "@/lib/agents/visualization/chart-types";

type ChartType = "quadrant" | "wave" | "radar";

interface ChartVizCardProps {
  type: ChartType;
  title: string;
  data: QuadrantDataPoint[] | WaveDataPoint[] | RadarDataPoint[];
  chartTitle?: string;
  subtitle?: string;
  category?: string;
  onFullscreen?: () => void;
  onImageExported?: (image: ImageResult) => void;
}

const EXPORT_DIMENSIONS: Record<ChartType, { width: number; height: number }> = {
  quadrant: { width: 800, height: 700 },
  wave: { width: 800, height: 650 },
  radar: { width: 800, height: 700 },
};

export function ChartVizCard({
  type,
  title,
  data,
  chartTitle,
  subtitle,
  category,
  onFullscreen,
  onImageExported,
}: ChartVizCardProps) {
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);
  const [exportedImage, setExportedImage] = useState<ImageResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 1, height: 1 });

  const exportChart = useCallback(async () => {
    if (!exportContainerRef.current || isExporting) return;

    setIsExporting(true);
    try {
      const result = await exportToPng(exportContainerRef.current, {
        backgroundColor: "#FFFFFF",
        pixelRatio: 2,
      });
      setExportedImage(result);
      onImageExported?.(result);
    } catch (error) {
      console.error("Failed to export chart:", error);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, onImageExported]);

  // Auto-export on mount after chart renders
  useEffect(() => {
    const timer = setTimeout(() => {
      exportChart();
    }, 500); // Give charts time to render

    return () => clearTimeout(timer);
  }, [exportChart]);

  // Track preview viewport size for scaling
  useEffect(() => {
    const element = previewViewportRef.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      setPreviewSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height }
      );
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const handleDownload = () => {
    if (!exportedImage?.dataUrl) return;

    const link = document.createElement("a");
    link.href = exportedImage.dataUrl;
    link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const baseDimensions = EXPORT_DIMENSIONS[type];
  const scale = Math.min(
    previewSize.width / baseDimensions.width,
    previewSize.height / baseDimensions.height,
    1
  );
  const scaledWidth = Math.max(1, Math.floor(baseDimensions.width * scale));
  const scaledHeight = Math.max(1, Math.floor(baseDimensions.height * scale));
  const aspectRatio = `${baseDimensions.width} / ${baseDimensions.height}`;

  const renderChart = () => {
    const dimensions = baseDimensions;
    switch (type) {
      case "quadrant":
        return (
          <MagicQuadrantChart
            data={data as QuadrantDataPoint[]}
            title={chartTitle || "Magic Quadrant"}
            dimensions={dimensions}
          />
        );
      case "wave":
        return (
          <ForresterWaveChart
            data={data as WaveDataPoint[]}
            subtitle={subtitle || category || "Analysis"}
            dimensions={dimensions}
          />
        );
      case "radar":
        return (
          <GigaOmRadarChart
            data={data as RadarDataPoint[]}
            category={category || subtitle || "Analysis"}
            dimensions={dimensions}
          />
        );
    }
  };

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden group hover:border-white/20 transition-all duration-300">
      {/* Title bar */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-white font-medium text-sm">{title}</h3>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDownload}
            disabled={!exportedImage}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-colors disabled:opacity-30"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onFullscreen}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart container */}
      <div
        className="relative w-full cursor-pointer overflow-hidden bg-white"
        style={{ aspectRatio }}
        onClick={onFullscreen}
      >
        <div
          ref={previewViewportRef}
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <div style={{ width: scaledWidth, height: scaledHeight, overflow: "hidden" }}>
            <div
              style={{
                width: baseDimensions.width,
                height: baseDimensions.height,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <div
                ref={exportContainerRef}
                style={{ width: baseDimensions.width, height: baseDimensions.height, backgroundColor: "#FFFFFF" }}
              >
                {renderChart()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
