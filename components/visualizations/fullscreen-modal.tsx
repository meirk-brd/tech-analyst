"use client";

import { useEffect, useCallback } from "react";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import type { ImageResult } from "@/lib/agents/visualization/types";

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  image: ImageResult;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export function FullscreenModal({
  isOpen,
  onClose,
  title,
  image,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: FullscreenModalProps) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = image.dataUrl;
    link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && hasPrevious && onPrevious) {
        onPrevious();
      } else if (e.key === "ArrowRight" && hasNext && onNext) {
        onNext();
      }
    },
    [onClose, onPrevious, onNext, hasPrevious, hasNext]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative max-w-5xl max-h-[90vh] w-full mx-4">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
          <h2 className="text-white font-semibold">{title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image */}
        <img
          src={image.dataUrl}
          alt={title}
          className="w-full h-full object-contain rounded-xl"
        />

        {/* Navigation arrows */}
        {hasPrevious && onPrevious && (
          <button
            onClick={onPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {hasNext && onNext && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
