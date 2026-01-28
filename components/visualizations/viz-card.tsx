"use client";

import { Download, Maximize2 } from "lucide-react";
import type { ImageResult } from "@/lib/agents/visualization/types";

interface VizCardProps {
  title: string;
  image: ImageResult;
  onFullscreen?: () => void;
}

export function VizCard({ title, image, onFullscreen }: VizCardProps) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = image.dataUrl;
    link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden group hover:border-white/20 transition-all duration-300">
      {/* Title bar */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-white font-medium text-sm">{title}</h3>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDownload}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-colors"
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

      {/* Image */}
      <div
        className="relative aspect-square cursor-pointer overflow-hidden"
        onClick={onFullscreen}
      >
        <img
          src={image.dataUrl}
          alt={title}
          className="w-full h-full object-contain bg-slate-950 group-hover:scale-105 transition-transform duration-300"
        />
      </div>
    </div>
  );
}
