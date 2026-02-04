"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { Visualizations } from "@/lib/agents/orchestration/types";
import { VizCard } from "./viz-card";
import { FullscreenModal } from "./fullscreen-modal";

interface VisualizationsGridProps {
  visualizations: Visualizations;
}

export function VisualizationsGrid({ visualizations }: VisualizationsGridProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const pyramidImage = visualizations.pyramid;
  const hasPyramid = pyramidImage?.dataUrl;

  const handleDownload = () => {
    if (pyramidImage?.dataUrl) {
      const link = document.createElement("a");
      link.href = pyramidImage.dataUrl;
      link.download = "market-pyramid.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!hasPyramid) {
    return (
      <div className="space-y-4">
        <h2 className="text-white font-semibold text-lg">Analysis Visualization</h2>
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
          <p className="text-white/60">Generating pyramid visualization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">Market Analysis Pyramid</h2>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 border border-white/20 text-white/90 text-sm rounded-lg hover:bg-white/5 hover:border-white/30 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>

      {/* Single Pyramid Card */}
      <div className="max-w-2xl mx-auto">
        <VizCard
          title="Market Pyramid"
          image={pyramidImage}
          onFullscreen={() => setIsFullscreen(true)}
        />
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && pyramidImage && (
        <FullscreenModal
          isOpen={isFullscreen}
          onClose={() => setIsFullscreen(false)}
          title="Market Analysis Pyramid"
          image={pyramidImage}
          hasPrevious={false}
          hasNext={false}
        />
      )}
    </div>
  );
}
