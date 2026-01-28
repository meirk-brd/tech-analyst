"use client";

/**
 * Chart export utilities for converting React chart components to PNG/SVG
 */

import { toPng, toSvg } from "html-to-image";
import type { ImageResult } from "./types";

export type ExportOptions = {
  /** Background color for the exported image */
  backgroundColor?: string;
  /** Pixel ratio for higher resolution exports (default: 2) */
  pixelRatio?: number;
  /** Quality for PNG export (0-1, default: 1) */
  quality?: number;
};

const DEFAULT_OPTIONS: Required<ExportOptions> = {
  backgroundColor: "#FFFFFF",
  pixelRatio: 2,
  quality: 1,
};

/**
 * Export a DOM element containing a chart to PNG base64
 */
export async function exportToPng(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<ImageResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const dataUrl = await toPng(element, {
    backgroundColor: opts.backgroundColor,
    pixelRatio: opts.pixelRatio,
    quality: opts.quality,
    cacheBust: true,
  });

  // Extract base64 from data URL
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");

  return {
    mimeType: "image/png",
    base64,
    dataUrl,
  };
}

/**
 * Export a DOM element containing a chart to SVG string
 */
export async function exportToSvg(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const svgDataUrl = await toSvg(element, {
    backgroundColor: opts.backgroundColor,
    cacheBust: true,
  });

  // Decode the SVG from the data URL
  const svgBase64 = svgDataUrl.replace(/^data:image\/svg\+xml;charset=utf-8,/, "");
  return decodeURIComponent(svgBase64);
}

/**
 * Export a DOM element to a data URL (useful for <img> src)
 */
export async function exportToDataUrl(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<string> {
  const result = await exportToPng(element, options);
  return result.dataUrl;
}

/**
 * Chart type identifier for routing to the correct chart component
 */
export type ChartType = "magic-quadrant" | "forrester-wave" | "gigaom-radar";

/**
 * Get the appropriate chart type based on visualization name
 */
export function getChartTypeFromName(name: string): ChartType {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes("quadrant") || normalizedName.includes("gartner")) {
    return "magic-quadrant";
  }

  if (normalizedName.includes("wave") || normalizedName.includes("forrester")) {
    return "forrester-wave";
  }

  if (normalizedName.includes("radar") || normalizedName.includes("gigaom")) {
    return "gigaom-radar";
  }

  // Default to magic quadrant
  return "magic-quadrant";
}
