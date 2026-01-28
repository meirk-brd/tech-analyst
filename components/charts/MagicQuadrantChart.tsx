"use client";

import { useMemo } from "react";
import type { QuadrantDataPoint, ChartDimensions } from "@/lib/agents/visualization/chart-types";
import { DEFAULT_CHART_DIMENSIONS } from "@/lib/agents/visualization/chart-types";
import { basePath } from "@/lib/base-path";

interface MagicQuadrantChartProps {
  data: QuadrantDataPoint[];
  title?: string;
  subtitle?: string;
  dimensions?: Partial<ChartDimensions>;
}

// Colors matching the Gartner reference
const COLORS = {
  dot: "#4878A8", // Blue dot fill
  dotStroke: "#3A6898",
  border: "#888888",
  gridLine: "#AAAAAA",
  labelBox: "#C97B63", // Coral/salmon for quadrant labels
  labelText: "#FFFFFF",
  text: "#333333",
  lightText: "#666666",
  background: "#FFFFFF",
};

// Label positioning configuration
const LABEL_CONFIG = {
  fontSize: 10,
  charWidth: 5.5, // Approximate width per character
  lineHeight: 12,
  dotRadius: 8,
  padding: 2, // Padding around labels for collision detection
  offsetFromDot: 10,
};

type LabelPosition = {
  x: number;
  y: number;
  anchor: "start" | "end" | "middle";
  company: string;
};

type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Check if two bounding boxes overlap (with padding)
 */
function boxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
  const pad = LABEL_CONFIG.padding;
  return !(
    a.x + a.width + pad < b.x ||
    b.x + b.width + pad < a.x ||
    a.y + a.height + pad < b.y ||
    b.y + b.height + pad < a.y
  );
}

/**
 * Get bounding box for a label
 */
function getLabelBounds(pos: LabelPosition): BoundingBox {
  const width = pos.company.length * LABEL_CONFIG.charWidth;
  let x = pos.x;

  if (pos.anchor === "end") {
    x = pos.x - width;
  } else if (pos.anchor === "middle") {
    x = pos.x - width / 2;
  }

  return {
    x,
    y: pos.y - LABEL_CONFIG.lineHeight / 2,
    width,
    height: LABEL_CONFIG.lineHeight,
  };
}

/**
 * Check if label overlaps with a dot
 */
function overlapsWithDot(
  bounds: BoundingBox,
  dotCx: number,
  dotCy: number
): boolean {
  const r = LABEL_CONFIG.dotRadius + 2;
  // Check if the dot circle overlaps with the label rectangle
  const closestX = Math.max(bounds.x, Math.min(dotCx, bounds.x + bounds.width));
  const closestY = Math.max(bounds.y, Math.min(dotCy, bounds.y + bounds.height));
  const distanceSquared = (closestX - dotCx) ** 2 + (closestY - dotCy) ** 2;
  return distanceSquared < r * r;
}

/**
 * Generate candidate positions around a point
 */
function generateCandidates(
  cx: number,
  cy: number,
  company: string
): LabelPosition[] {
  const offset = LABEL_CONFIG.offsetFromDot;
  const candidates: LabelPosition[] = [];

  // 8 positions around the dot at different distances
  const distances = [offset, offset * 1.5, offset * 2, offset * 2.5];

  for (const dist of distances) {
    // Right
    candidates.push({ x: cx + dist, y: cy, anchor: "start", company });
    // Left
    candidates.push({ x: cx - dist, y: cy, anchor: "end", company });
    // Above center
    candidates.push({ x: cx, y: cy - dist, anchor: "middle", company });
    // Below center
    candidates.push({ x: cx, y: cy + dist + LABEL_CONFIG.lineHeight, anchor: "middle", company });
    // Above right
    candidates.push({ x: cx + dist * 0.7, y: cy - dist * 0.7, anchor: "start", company });
    // Above left
    candidates.push({ x: cx - dist * 0.7, y: cy - dist * 0.7, anchor: "end", company });
    // Below right
    candidates.push({ x: cx + dist * 0.7, y: cy + dist * 0.7 + LABEL_CONFIG.lineHeight, anchor: "start", company });
    // Below left
    candidates.push({ x: cx - dist * 0.7, y: cy + dist * 0.7 + LABEL_CONFIG.lineHeight, anchor: "end", company });
  }

  return candidates;
}

/**
 * Calculate optimal label positions to avoid overlaps
 */
function calculateLabelPositions(
  data: QuadrantDataPoint[],
  margin: { top: number; left: number },
  chartWidth: number,
  chartHeight: number
): LabelPosition[] {
  // Calculate dot positions
  const dotPositions = data.map((point) => ({
    cx: margin.left + (point.vision / 100) * chartWidth,
    cy: margin.top + chartHeight - (point.execution / 100) * chartHeight,
  }));

  // Initialize positions
  const positions: LabelPosition[] = data.map((point, i) => ({
    x: dotPositions[i].cx - LABEL_CONFIG.offsetFromDot,
    y: dotPositions[i].cy - LABEL_CONFIG.offsetFromDot,
    anchor: "end" as const,
    company: point.company,
  }));

  // Sort by execution (higher first) so important companies get priority
  const sortedIndices = data
    .map((_, i) => i)
    .sort((a, b) => data[b].execution - data[a].execution);

  const placedBounds: BoundingBox[] = [];

  for (const idx of sortedIndices) {
    const point = data[idx];
    const { cx, cy } = dotPositions[idx];

    const candidates = generateCandidates(cx, cy, point.company);
    let bestCandidate = candidates[0];
    let bestScore = -Infinity;

    for (const candidate of candidates) {
      const bounds = getLabelBounds(candidate);

      // Check if within chart bounds (with some margin)
      if (
        bounds.x < margin.left - 30 ||
        bounds.x + bounds.width > margin.left + chartWidth + 50 ||
        bounds.y < margin.top + 35 || // Leave room for quadrant labels
        bounds.y + bounds.height > margin.top + chartHeight - 35
      ) {
        continue;
      }

      // Check overlap with already placed labels
      const hasLabelOverlap = placedBounds.some((placed) =>
        boxesOverlap(bounds, placed)
      );
      if (hasLabelOverlap) continue;

      // Check overlap with ANY dot (not just the current one)
      const hasDotOverlap = dotPositions.some(
        (dot) => overlapsWithDot(bounds, dot.cx, dot.cy)
      );
      if (hasDotOverlap) continue;

      // Score: prefer positions closer to the dot and above/right
      const distance = Math.sqrt((candidate.x - cx) ** 2 + (candidate.y - cy) ** 2);
      const score = -distance + (candidate.y < cy ? 5 : 0); // Slight preference for above

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    positions[idx] = bestCandidate;
    placedBounds.push(getLabelBounds(bestCandidate));
  }

  return positions;
}

export function MagicQuadrantChart({
  data,
  title = "Magic Quadrant",
  subtitle,
  dimensions,
}: MagicQuadrantChartProps) {
  const config = useMemo(() => {
    const width = dimensions?.width ?? DEFAULT_CHART_DIMENSIONS.width;
    const height = dimensions?.height ?? DEFAULT_CHART_DIMENSIONS.height;
    const margin = {
      top: 80,
      right: 40,
      bottom: 100,
      left: 60,
    };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    return { width, height, margin, chartWidth, chartHeight };
  }, [dimensions]);

  const { width, height, margin, chartWidth, chartHeight } = config;

  // Calculate label positions with collision avoidance
  const labelPositions = useMemo(
    () => calculateLabelPositions(data, margin, chartWidth, chartHeight),
    [data, margin, chartWidth, chartHeight]
  );

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        fontFamily: "Arial, sans-serif",
        backgroundColor: COLORS.background,
      }}
    >
      {/* Title */}
      {title && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 0,
            right: 0,
            textAlign: "center",
            fontWeight: 600,
            fontSize: 14,
            color: COLORS.text,
          }}
        >
          {title}
          {subtitle && (
            <div style={{ fontWeight: 400, fontSize: 12, marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>
      )}

      <svg width={width} height={height}>
        {/* Chart border */}
        <rect
          x={margin.left}
          y={margin.top}
          width={chartWidth}
          height={chartHeight}
          fill="none"
          stroke={COLORS.border}
          strokeWidth={1}
        />

        {/* Quadrant dividing lines */}
        <line
          x1={margin.left + chartWidth / 2}
          y1={margin.top}
          x2={margin.left + chartWidth / 2}
          y2={margin.top + chartHeight}
          stroke={COLORS.gridLine}
          strokeWidth={1}
        />
        <line
          x1={margin.left}
          y1={margin.top + chartHeight / 2}
          x2={margin.left + chartWidth}
          y2={margin.top + chartHeight / 2}
          stroke={COLORS.gridLine}
          strokeWidth={1}
        />

        {/* Quadrant Labels */}
        {/* CHALLENGERS - top left */}
        <g>
          <rect
            x={margin.left + chartWidth * 0.25 - 55}
            y={margin.top + 8}
            width={110}
            height={24}
            fill={COLORS.labelBox}
          />
          <text
            x={margin.left + chartWidth * 0.25}
            y={margin.top + 24}
            fontSize={11}
            fontWeight={600}
            fill={COLORS.labelText}
            textAnchor="middle"
          >
            CHALLENGERS
          </text>
        </g>

        {/* LEADERS - top right */}
        <g>
          <rect
            x={margin.left + chartWidth * 0.75 - 40}
            y={margin.top + 8}
            width={80}
            height={24}
            fill={COLORS.labelBox}
          />
          <text
            x={margin.left + chartWidth * 0.75}
            y={margin.top + 24}
            fontSize={11}
            fontWeight={600}
            fill={COLORS.labelText}
            textAnchor="middle"
          >
            LEADERS
          </text>
        </g>

        {/* NICHE PLAYERS - bottom left */}
        <g>
          <rect
            x={margin.left + chartWidth * 0.25 - 55}
            y={margin.top + chartHeight - 32}
            width={110}
            height={24}
            fill={COLORS.labelBox}
          />
          <text
            x={margin.left + chartWidth * 0.25}
            y={margin.top + chartHeight - 16}
            fontSize={11}
            fontWeight={600}
            fill={COLORS.labelText}
            textAnchor="middle"
          >
            NICHE PLAYERS
          </text>
        </g>

        {/* VISIONARIES - bottom right */}
        <g>
          <rect
            x={margin.left + chartWidth * 0.75 - 50}
            y={margin.top + chartHeight - 32}
            width={100}
            height={24}
            fill={COLORS.labelBox}
          />
          <text
            x={margin.left + chartWidth * 0.75}
            y={margin.top + chartHeight - 16}
            fontSize={11}
            fontWeight={600}
            fill={COLORS.labelText}
            textAnchor="middle"
          >
            VISIONARIES
          </text>
        </g>

        {/* Y-axis arrow and label */}
        <g>
          <line
            x1={margin.left - 25}
            y1={margin.top + chartHeight}
            x2={margin.left - 25}
            y2={margin.top + 20}
            stroke={COLORS.lightText}
            strokeWidth={1}
          />
          <polygon
            points={`${margin.left - 25},${margin.top + 10} ${margin.left - 29},${margin.top + 20} ${margin.left - 21},${margin.top + 20}`}
            fill={COLORS.lightText}
          />
          <text
            x={margin.left - 40}
            y={margin.top + chartHeight / 2}
            fontSize={10}
            fill={COLORS.lightText}
            textAnchor="middle"
            transform={`rotate(-90, ${margin.left - 40}, ${margin.top + chartHeight / 2})`}
            letterSpacing={1}
          >
            ABILITY TO EXECUTE
          </text>
        </g>

        {/* X-axis arrow and label */}
        <g>
          <line
            x1={margin.left}
            y1={margin.top + chartHeight + 25}
            x2={margin.left + chartWidth - 20}
            y2={margin.top + chartHeight + 25}
            stroke={COLORS.lightText}
            strokeWidth={1}
          />
          <polygon
            points={`${margin.left + chartWidth - 10},${margin.top + chartHeight + 25} ${margin.left + chartWidth - 20},${margin.top + chartHeight + 21} ${margin.left + chartWidth - 20},${margin.top + chartHeight + 29}`}
            fill={COLORS.lightText}
          />
          <text
            x={margin.left + chartWidth / 2}
            y={margin.top + chartHeight + 45}
            fontSize={10}
            fill={COLORS.lightText}
            textAnchor="middle"
            letterSpacing={1}
          >
            COMPLETENESS OF VISION
          </text>
        </g>

        {/* Company dots and labels */}
        {data.map((point, index) => {
          const cx = margin.left + (point.vision / 100) * chartWidth;
          const cy = margin.top + chartHeight - (point.execution / 100) * chartHeight;
          const labelPos = labelPositions[index];

          return (
            <g key={`point-${index}`}>
              {/* Dot */}
              <circle
                cx={cx}
                cy={cy}
                r={LABEL_CONFIG.dotRadius}
                fill={COLORS.dot}
                stroke={COLORS.dotStroke}
                strokeWidth={1}
              />
              {/* Label with collision-avoided position */}
              <text
                x={labelPos.x}
                y={labelPos.y}
                fontSize={LABEL_CONFIG.fontSize}
                fill={COLORS.text}
                textAnchor={labelPos.anchor}
                fontFamily="Arial, sans-serif"
              >
                {point.company}
              </text>
            </g>
          );
        })}

        {/* Footer */}
        <text
          x={margin.left}
          y={height - 20}
          fontSize={10}
          fill={COLORS.lightText}
        >
          As of {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </text>

        {/* Bright Data logo watermark */}
        <g transform={`translate(${width - 130}, ${height - 25})`}>
          <text
            x={0}
            y={12}
            fontSize={9}
            fill={COLORS.lightText}
          >
            generated by
          </text>
          <image
            href={`${basePath}/bright-data-logo.png`}
            x={65}
            y={0}
            width={60}
            height={16}
            opacity={0.8}
          />
        </g>
      </svg>
    </div>
  );
}
