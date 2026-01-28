/**
 * Transform VisualizationScores to chart-specific data formats
 */

import type { VisualizationScores } from "./types";
import type {
  QuadrantDataPoint,
  WaveDataPoint,
  RadarDataPoint,
  MovementType,
} from "./chart-types";

/**
 * Transform scores to Magic Quadrant data points.
 * This is a direct mapping since VisualizationScores already contains
 * the required fields (company, vision, execution, quadrant).
 */
export function toQuadrantData(scores: VisualizationScores): QuadrantDataPoint[] {
  return scores.map((score) => ({
    company: score.company,
    vision: score.vision,
    execution: score.execution,
    quadrant: score.quadrant,
  }));
}

/**
 * Transform scores to Forrester Wave data points.
 *
 * Mapping:
 * - strategy (x-axis): derived from vision score
 * - currentOffering (y-axis): derived from execution score
 * - marketPresence: derived from average of vision and execution (represents overall strength)
 */
export function toWaveData(scores: VisualizationScores): WaveDataPoint[] {
  return scores.map((score) => ({
    company: score.company,
    // Strategy maps to vision - forward-looking capabilities
    strategy: score.vision,
    // Current offering maps to execution - current ability to deliver
    currentOffering: score.execution,
    // Market presence derived from combined strength
    marketPresence: calculateMarketPresence(score.vision, score.execution),
  }));
}

/**
 * Transform scores to GigaOm Radar data points.
 *
 * Mapping:
 * - angle: distributed based on company position to avoid overlaps
 * - radius: inversely related to overall score (higher score = closer to center = leader)
 * - tier: derived from quadrant and scores
 * - movement: derived from score characteristics
 */
export function toRadarData(scores: VisualizationScores): RadarDataPoint[] {
  // Sort by combined score to distribute companies logically
  const sortedScores = [...scores].sort((a, b) => {
    const scoreA = a.vision + a.execution;
    const scoreB = b.vision + b.execution;
    return scoreB - scoreA; // Higher scores first
  });

  return sortedScores.map((score, index) => {
    const tier = calculateTier(score.quadrant, score.vision, score.execution);
    const angle = calculateAngle(score.vision, score.execution, index, sortedScores.length);
    const radius = calculateRadius(score.vision, score.execution, tier);
    const movement = calculateMovement(score.vision, score.execution);
    const movementAngle = calculateMovementAngle(angle, movement);

    return {
      company: score.company,
      angle,
      radius,
      tier,
      movement,
      movementAngle,
    };
  });
}

/**
 * Calculate market presence from vision and execution scores.
 * Uses weighted average with slight emphasis on execution.
 */
function calculateMarketPresence(vision: number, execution: number): number {
  // Weight execution slightly higher (55%) as it represents current market presence
  return Math.round(execution * 0.55 + vision * 0.45);
}

/**
 * Calculate tier based on quadrant and scores.
 */
function calculateTier(
  quadrant: QuadrantDataPoint["quadrant"],
  vision: number,
  execution: number
): RadarDataPoint["tier"] {
  const combinedScore = (vision + execution) / 2;

  // Leaders quadrant typically maps to Leader/Challenger tier
  if (quadrant === "Leaders") {
    return combinedScore >= 80 ? "Leader" : "Challenger";
  }

  // Challengers and Visionaries map to Challenger/Entrant based on scores
  if (quadrant === "Challengers" || quadrant === "Visionaries") {
    return combinedScore >= 60 ? "Challenger" : "Entrant";
  }

  // Niche Players are typically Entrants
  return combinedScore >= 50 ? "Challenger" : "Entrant";
}

/**
 * Calculate angle position around the radar.
 * Distributes companies across the radar based on their characteristics:
 * - High vision, high execution: top-right quadrant (0-90°)
 * - Low vision, high execution: top-left quadrant (270-360°)
 * - High vision, low execution: bottom-right quadrant (90-180°)
 * - Low vision, low execution: bottom-left quadrant (180-270°)
 */
function calculateAngle(
  vision: number,
  execution: number,
  index: number,
  total: number
): number {
  // Determine base quadrant
  const isHighVision = vision >= 50;
  const isHighExecution = execution >= 50;

  let baseAngle: number;
  let quadrantSpread: number;

  if (isHighVision && isHighExecution) {
    // Top-right: Innovation & Maturity
    baseAngle = 30;
    quadrantSpread = 60;
  } else if (!isHighVision && isHighExecution) {
    // Top-left: Maturity & Feature Play
    baseAngle = 300;
    quadrantSpread = 60;
  } else if (isHighVision && !isHighExecution) {
    // Bottom-right: Platform Play & Innovation
    baseAngle = 120;
    quadrantSpread = 60;
  } else {
    // Bottom-left: Feature Play & Platform Play
    baseAngle = 210;
    quadrantSpread = 60;
  }

  // Add some variation based on exact scores to prevent overlap
  const visionOffset = (vision % 20) / 20 * 30;
  const executionOffset = (execution % 20) / 20 * 15;

  // Normalize angle to 0-360
  let angle = baseAngle + visionOffset - executionOffset;
  if (angle < 0) angle += 360;
  if (angle >= 360) angle -= 360;

  return Math.round(angle);
}

/**
 * Calculate radius (distance from center).
 * Lower radius = closer to center = more mature/leader.
 * Range: 20-80 (leaving room for visual spacing)
 */
function calculateRadius(
  vision: number,
  execution: number,
  tier: RadarDataPoint["tier"]
): number {
  const combinedScore = (vision + execution) / 2;

  // Base radius by tier
  const tierRadius: Record<RadarDataPoint["tier"], [number, number]> = {
    Leader: [60, 80], // Inner ring (closer to center = higher radius in this chart)
    Challenger: [35, 60],
    Entrant: [15, 35],
  };

  const [min, max] = tierRadius[tier];

  // Scale within tier range based on combined score
  // Higher scores get higher radius (closer to center visually)
  const scoreRatio = combinedScore / 100;
  const radius = min + (max - min) * scoreRatio;

  return Math.round(radius);
}

/**
 * Calculate movement type based on score characteristics.
 */
function calculateMovement(vision: number, execution: number): MovementType {
  const visionWeight = vision / 100;
  const executionWeight = execution / 100;
  const combined = (vision + execution) / 2;

  // Outperformers: balanced high scores
  if (combined >= 75 && Math.abs(vision - execution) <= 15) {
    return "outperformer";
  }

  // Fast movers: high vision relative to execution (innovative)
  if (vision > execution + 10 && vision >= 60) {
    return "fast";
  }

  // Forward movers: solid execution, growing vision
  if (execution >= 50 && vision >= 40) {
    return "forward";
  }

  // No significant movement indicator
  return combined >= 50 ? "forward" : null;
}

/**
 * Calculate movement arrow angle based on position and movement type.
 */
function calculateMovementAngle(
  positionAngle: number,
  movement: MovementType
): number {
  if (!movement) return positionAngle;

  // Movement arrows generally point toward center (higher maturity)
  // with variations based on movement type
  switch (movement) {
    case "outperformer":
      // Points more directly toward center (innovation axis)
      return (positionAngle + 180) % 360;
    case "fast":
      // Points toward innovation (bottom of radar)
      return 180;
    case "forward":
      // Points toward maturity (top of radar)
      return 0;
    default:
      return positionAngle;
  }
}
