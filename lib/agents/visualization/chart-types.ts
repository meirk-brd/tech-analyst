/**
 * Chart data types for programmatic visualization rendering
 */

// Re-export for convenience
export type { VisualizationScores } from "./types";

// Re-export transformers
export { toQuadrantData, toWaveData, toRadarData } from "./transform-scores";

/**
 * Magic Quadrant (Gartner-style) data point
 */
export type QuadrantDataPoint = {
  company: string;
  vision: number; // x-axis (0-100) - "Completeness of Vision"
  execution: number; // y-axis (0-100) - "Ability to Execute"
  quadrant: "Leaders" | "Challengers" | "Visionaries" | "Niche Players";
};

/**
 * Forrester Wave data point
 */
export type WaveDataPoint = {
  company: string;
  strategy: number; // x-axis (0-100) - "Weaker → Stronger strategy"
  currentOffering: number; // y-axis (0-100) - "Weaker → Stronger current offering"
  marketPresence: number; // bubble size (0-100)
};

/**
 * Movement direction for GigaOm Radar
 */
export type MovementType = "forward" | "fast" | "outperformer" | null;

/**
 * GigaOm Radar data point
 */
export type RadarDataPoint = {
  company: string;
  angle: number; // position around circle (0-360 degrees)
  radius: number; // distance from center (0-100, where 0 = center/leader, 100 = outer/entrant)
  tier: "Leader" | "Challenger" | "Entrant";
  movement: MovementType;
  movementAngle?: number; // direction of the movement arrow (0-360 degrees)
};

/**
 * Wave zone classification based on position
 */
export type WaveZone = "Challengers" | "Contenders" | "Strong Performers" | "Leaders";

/**
 * Chart dimensions configuration
 */
export type ChartDimensions = {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

/**
 * Default chart dimensions
 */
export const DEFAULT_CHART_DIMENSIONS: ChartDimensions = {
  width: 800,
  height: 600,
  margin: {
    top: 60,
    right: 60,
    bottom: 80,
    left: 80,
  },
};

/**
 * Color palette for charts
 */
export const CHART_COLORS = {
  // Magic Quadrant
  quadrant: {
    dot: "#4A7AB8", // Blue dots
    dotStroke: "#3A6AA8",
    border: "#666666",
    labelBackground: "#D4856A", // Coral/salmon for quadrant labels
    labelText: "#FFFFFF",
    gridLine: "#CCCCCC",
    axisLabel: "#333333",
  },
  // Forrester Wave
  wave: {
    challengers: "#E8E8E8", // Gray
    contenders: "#D0E4F0", // Light gray-blue
    strongPerformers: "#7FBFDF", // Light blue
    leaders: "#2B8BBF", // Dark blue
    dot: "#FFFFFF",
    dotCenter: "#333333",
    dotStroke: "#666666",
  },
  // GigaOm Radar
  radar: {
    rings: ["#D8D8D8", "#C8C8C8", "#B8B8B8"], // Outer to inner
    centerHole: "#FFFFFF",
    axisLine: "#999999",
    forwardMover: "#4A7AB8", // Blue
    fastMover: "#4A7AB8", // Blue
    outperformer: "#E07020", // Orange
    headerBackground: "#C84B31", // Red-orange header
  },
} as const;
