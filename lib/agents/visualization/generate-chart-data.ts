/**
 * Generate chart data from visualization scores.
 * This replaces the AI-based image generation with programmatic chart data.
 */

import type { VisualizationScores } from "./types";
import {
  toQuadrantData,
  toWaveData,
  toRadarData,
  type QuadrantDataPoint,
  type WaveDataPoint,
  type RadarDataPoint,
} from "./chart-types";
import { logVisualization } from "./logger";

export type ChartDataResult = {
  quadrant: {
    type: "magic-quadrant";
    data: QuadrantDataPoint[];
    title: string;
  };
  wave: {
    type: "forrester-wave";
    data: WaveDataPoint[];
    subtitle: string;
  };
  radar: {
    type: "gigaom-radar";
    data: RadarDataPoint[];
    category: string;
  };
};

export type GenerateChartDataOptions = {
  quadrantTitle?: string;
  waveSubtitle?: string;
  radarCategory?: string;
};

/**
 * Generate chart data for all three visualization types from scores.
 * This is a synchronous, fast operation that transforms the input data.
 */
export function generateChartData(
  scores: VisualizationScores,
  options: GenerateChartDataOptions = {}
): ChartDataResult {
  logVisualization("chart-data.generate", { total: scores.length });

  const quadrantData = toQuadrantData(scores);
  const waveData = toWaveData(scores);
  const radarData = toRadarData(scores);

  logVisualization("chart-data.complete", {
    quadrant: quadrantData.length,
    wave: waveData.length,
    radar: radarData.length,
  });

  return {
    quadrant: {
      type: "magic-quadrant",
      data: quadrantData,
      title: options.quadrantTitle || "Magic Quadrant Analysis",
    },
    wave: {
      type: "forrester-wave",
      data: waveData,
      subtitle: options.waveSubtitle || "Competitive Analysis",
    },
    radar: {
      type: "gigaom-radar",
      data: radarData,
      category: options.radarCategory || "Market Analysis",
    },
  };
}
