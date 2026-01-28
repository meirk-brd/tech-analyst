"use client";

import { useState, useCallback } from "react";
import { Download } from "lucide-react";
import type { Visualizations } from "@/lib/agents/orchestration/types";
import type { ImageResult } from "@/lib/agents/visualization/types";
import { VizCard } from "./viz-card";
import { ChartVizCard } from "./chart-viz-card";
import { FullscreenModal } from "./fullscreen-modal";

interface VisualizationsGridProps {
  visualizations: Visualizations;
}

type VizType = "quadrant" | "wave" | "radar";

const VIZ_TITLES: Record<VizType, string> = {
  quadrant: "Magic Quadrant",
  wave: "Wave",
  radar: "Radar",
};

const VIZ_ORDER: VizType[] = ["quadrant", "wave", "radar"];

export function VisualizationsGrid({ visualizations }: VisualizationsGridProps) {
  const [selectedViz, setSelectedViz] = useState<VizType | null>(null);
  // Store exported images from chart rendering
  const [exportedImages, setExportedImages] = useState<Partial<Record<VizType, ImageResult>>>({});

  // Check if we have chart data (Recharts mode) or pre-rendered images (AI mode)
  const hasChartData = !!visualizations.chartData;

  const handleImageExported = useCallback((type: VizType, image: ImageResult) => {
    setExportedImages((prev) => ({ ...prev, [type]: image }));
  }, []);

  const getImageForType = (type: VizType): ImageResult | null => {
    if (hasChartData) {
      return exportedImages[type] || null;
    }
    return visualizations[type]?.dataUrl ? visualizations[type] : null;
  };

  const handleDownloadAll = () => {
    VIZ_ORDER.forEach((type) => {
      const image = getImageForType(type);
      if (image?.dataUrl) {
        const link = document.createElement("a");
        link.href = image.dataUrl;
        link.download = `${VIZ_TITLES[type].toLowerCase().replace(/\s+/g, "-")}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  const currentIndex = selectedViz ? VIZ_ORDER.indexOf(selectedViz) : -1;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setSelectedViz(VIZ_ORDER[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < VIZ_ORDER.length - 1) {
      setSelectedViz(VIZ_ORDER[currentIndex + 1]);
    }
  };

  const renderVizCard = (type: VizType) => {
    if (hasChartData && visualizations.chartData) {
      const chartData = visualizations.chartData;
      const data =
        type === "quadrant"
          ? chartData.quadrant.data
          : type === "wave"
            ? chartData.wave.data
            : chartData.radar.data;

      return (
        <ChartVizCard
          key={type}
          type={type}
          title={VIZ_TITLES[type]}
          data={data}
          chartTitle={type === "quadrant" ? chartData.quadrant.title : undefined}
          subtitle={type === "wave" ? chartData.wave.subtitle : undefined}
          category={type === "radar" ? chartData.radar.category : undefined}
          onFullscreen={() => setSelectedViz(type)}
          onImageExported={(image) => handleImageExported(type, image)}
        />
      );
    }

    // Legacy: pre-rendered image mode
    const image = visualizations[type];
    if (!image?.dataUrl) return null;

    return (
      <VizCard
        key={type}
        title={VIZ_TITLES[type]}
        image={image}
        onFullscreen={() => setSelectedViz(type)}
      />
    );
  };

  const selectedImage = selectedViz ? getImageForType(selectedViz) : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">Analysis Visualizations</h2>
        <button
          onClick={handleDownloadAll}
          className="flex items-center gap-2 px-4 py-2 border border-white/20 text-white/90 text-sm rounded-lg hover:bg-white/5 hover:border-white/30 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download All
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {VIZ_ORDER.map((type) => renderVizCard(type))}
      </div>

      {/* Fullscreen modal */}
      {selectedViz && selectedImage && (
        <FullscreenModal
          isOpen={!!selectedViz}
          onClose={() => setSelectedViz(null)}
          title={VIZ_TITLES[selectedViz]}
          image={selectedImage}
          onPrevious={handlePrevious}
          onNext={handleNext}
          hasPrevious={currentIndex > 0}
          hasNext={currentIndex < VIZ_ORDER.length - 1}
        />
      )}
    </div>
  );
}
