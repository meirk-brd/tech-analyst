"use client";

import { useMemo } from "react";
import type { WaveDataPoint, ChartDimensions } from "@/lib/agents/visualization/chart-types";
import { DEFAULT_CHART_DIMENSIONS } from "@/lib/agents/visualization/chart-types";
import { basePath } from "@/lib/base-path";

interface ForresterWaveChartProps {
  data: WaveDataPoint[];
  title?: string;
  subtitle?: string;
  dimensions?: Partial<ChartDimensions>;
}

// Colors matching the Forrester Wave reference - quarter circle arcs from bottom-left
const COLORS = {
  // Zone bands (innermost to outermost from bottom-left corner)
  challengers: "#E5E5E5", // Light gray (smallest arc, bottom-left)
  contenders: "#B8DCE8", // Light blue
  strongPerformers: "#5BB4D4", // Medium blue
  leaders: "#0082B4", // Dark blue/teal (largest arc, top-right)

  // Company dots
  dotFill: "#FFFFFF",
  dotStroke: "#888888",
  dotCenter: "#444444",

  // Text
  text: "#333333",
  lightText: "#666666",
  titleColor: "#0082B4", // Teal for title

  background: "#FFFFFF",
};

// Label configuration
const LABEL_CONFIG = {
  fontSize: 10,
  charWidth: 5.5,
  lineHeight: 12,
  padding: 3,
};

// Bubble size range
const BUBBLE_CONFIG = {
  minRadius: 6,
  maxRadius: 18,
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

function boxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
  const pad = LABEL_CONFIG.padding;
  return !(
    a.x + a.width + pad < b.x ||
    b.x + b.width + pad < a.x ||
    a.y + a.height + pad < b.y ||
    b.y + b.height + pad < a.y
  );
}

function getLabelBounds(pos: LabelPosition): BoundingBox {
  const width = pos.company.length * LABEL_CONFIG.charWidth;
  let x = pos.x;
  if (pos.anchor === "end") x = pos.x - width;
  else if (pos.anchor === "middle") x = pos.x - width / 2;
  return {
    x,
    y: pos.y - LABEL_CONFIG.lineHeight / 2,
    width,
    height: LABEL_CONFIG.lineHeight,
  };
}

/**
 * Calculate bubble radius based on market presence score
 */
function getBubbleRadius(marketPresence: number): number {
  const normalized = Math.max(0, Math.min(100, marketPresence)) / 100;
  return BUBBLE_CONFIG.minRadius + normalized * (BUBBLE_CONFIG.maxRadius - BUBBLE_CONFIG.minRadius);
}

/**
 * Generate SVG path for quarter-circle arc zones
 * Arcs emanate from bottom-left corner as quarter circles
 */
function generateArcZonePath(
  zoneIndex: number,
  totalZones: number,
  chartX: number,
  chartY: number,
  chartWidth: number,
  chartHeight: number
): string {
  // Origin is at bottom-left corner of the chart
  const originX = chartX;
  const originY = chartY + chartHeight;

  // The maximum radius would reach the top-right corner
  // Use the diagonal distance as the max radius reference
  const maxRadius = Math.sqrt(chartWidth * chartWidth + chartHeight * chartHeight);

  // Calculate inner and outer radii for this zone band
  const innerRatio = zoneIndex / totalZones;
  const outerRatio = (zoneIndex + 1) / totalZones;

  const innerRadius = maxRadius * innerRatio;
  const outerRadius = maxRadius * outerRatio;

  // For the innermost zone (challengers), it's a pie slice from origin
  if (zoneIndex === 0) {
    // Quarter circle from origin
    // Start at bottom (0 degrees), sweep to left (90 degrees)
    const outerEndX = originX;
    const outerEndY = originY - outerRadius;
    const outerStartX = originX + outerRadius;
    const outerStartY = originY;

    return `
      M ${originX} ${originY}
      L ${outerStartX} ${outerStartY}
      A ${outerRadius} ${outerRadius} 0 0 0 ${outerEndX} ${outerEndY}
      L ${originX} ${originY}
      Z
    `;
  }

  // For other zones, create an arc band between inner and outer radius
  const innerEndX = originX;
  const innerEndY = originY - innerRadius;
  const innerStartX = originX + innerRadius;
  const innerStartY = originY;

  const outerEndX = originX;
  const outerEndY = originY - outerRadius;
  const outerStartX = originX + outerRadius;
  const outerStartY = originY;

  return `
    M ${innerStartX} ${innerStartY}
    A ${innerRadius} ${innerRadius} 0 0 0 ${innerEndX} ${innerEndY}
    L ${outerEndX} ${outerEndY}
    A ${outerRadius} ${outerRadius} 0 0 1 ${outerStartX} ${outerStartY}
    Z
  `;
}

/**
 * Calculate label positions with collision avoidance
 */
function calculateLabelPositions(
  data: WaveDataPoint[],
  margin: { top: number; left: number },
  chartWidth: number,
  chartHeight: number
): LabelPosition[] {
  const dotPositions = data.map((point) => ({
    cx: margin.left + (point.strategy / 100) * chartWidth,
    cy: margin.top + chartHeight - (point.currentOffering / 100) * chartHeight,
    radius: getBubbleRadius(point.marketPresence),
  }));

  const positions: LabelPosition[] = data.map((point, i) => ({
    x: dotPositions[i].cx + dotPositions[i].radius + 5,
    y: dotPositions[i].cy,
    anchor: "start" as const,
    company: point.company,
  }));

  // Sort by combined score (higher first for priority)
  const sortedIndices = data
    .map((_, i) => i)
    .sort((a, b) => (data[b].strategy + data[b].currentOffering) - (data[a].strategy + data[a].currentOffering));

  const placedBounds: BoundingBox[] = [];

  for (const idx of sortedIndices) {
    const point = data[idx];
    const { cx, cy, radius } = dotPositions[idx];
    const offset = radius + 4;

    const candidates: LabelPosition[] = [
      { x: cx + offset, y: cy - 2, anchor: "start", company: point.company },
      { x: cx - offset, y: cy - 2, anchor: "end", company: point.company },
      { x: cx + offset, y: cy + 2, anchor: "start", company: point.company },
      { x: cx - offset, y: cy + 2, anchor: "end", company: point.company },
      { x: cx, y: cy - offset - 6, anchor: "middle", company: point.company },
      { x: cx, y: cy + offset + LABEL_CONFIG.lineHeight, anchor: "middle", company: point.company },
      { x: cx + offset * 0.8, y: cy - offset * 0.6, anchor: "start", company: point.company },
      { x: cx - offset * 0.8, y: cy - offset * 0.6, anchor: "end", company: point.company },
      { x: cx + offset * 1.3, y: cy, anchor: "start", company: point.company },
      { x: cx - offset * 1.3, y: cy, anchor: "end", company: point.company },
    ];

    let bestCandidate = candidates[0];

    for (const candidate of candidates) {
      const bounds = getLabelBounds(candidate);

      if (
        bounds.x < margin.left - 5 ||
        bounds.x + bounds.width > margin.left + chartWidth + 20 ||
        bounds.y < margin.top + 5 ||
        bounds.y + bounds.height > margin.top + chartHeight - 5
      ) {
        continue;
      }

      const hasOverlap = placedBounds.some((placed) => boxesOverlap(bounds, placed));
      if (!hasOverlap) {
        const hitsBubble = dotPositions.some((dot) => {
          const closestX = Math.max(bounds.x, Math.min(dot.cx, bounds.x + bounds.width));
          const closestY = Math.max(bounds.y, Math.min(dot.cy, bounds.y + bounds.height));
          const dist = Math.sqrt((closestX - dot.cx) ** 2 + (closestY - dot.cy) ** 2);
          return dist < dot.radius + 2;
        });

        if (!hitsBubble) {
          bestCandidate = candidate;
          break;
        }
      }
    }

    positions[idx] = bestCandidate;
    placedBounds.push(getLabelBounds(bestCandidate));
  }

  return positions;
}

export function ForresterWaveChart({
  data,
  title = "THE WAVE",
  subtitle,
  dimensions,
}: ForresterWaveChartProps) {
  const config = useMemo(() => {
    const width = dimensions?.width ?? DEFAULT_CHART_DIMENSIONS.width;
    const height = dimensions?.height ?? DEFAULT_CHART_DIMENSIONS.height;
    const margin = {
      top: 100,
      right: 30,
      bottom: 60,
      left: 70,
    };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    return { width, height, margin, chartWidth, chartHeight };
  }, [dimensions]);

  const { width, height, margin, chartWidth, chartHeight } = config;

  const labelPositions = useMemo(
    () => calculateLabelPositions(data, margin, chartWidth, chartHeight),
    [data, margin, chartWidth, chartHeight]
  );

  // Zones from innermost (challengers) to outermost (leaders)
  const zones = [
    { name: "Challengers", color: COLORS.challengers },
    { name: "Contenders", color: COLORS.contenders },
    { name: "Strong\nPerformers", color: COLORS.strongPerformers },
    { name: "Leaders", color: COLORS.leaders },
  ];

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
      <svg width={width} height={height}>
        {/* Clip path to keep arcs within chart area */}
        <defs>
          <clipPath id="chart-clip">
            <rect
              x={margin.left}
              y={margin.top}
              width={chartWidth}
              height={chartHeight}
            />
          </clipPath>
        </defs>

        {/* Title */}
        <text
          x={margin.left}
          y={30}
          fontSize={18}
          fontWeight={700}
          fontStyle="italic"
          fill={COLORS.titleColor}
        >
          {title}
        </text>
        {subtitle && (
          <>
            <text
              x={margin.left}
              y={50}
              fontSize={14}
              fontWeight={600}
              fill={COLORS.text}
            >
              {subtitle}
            </text>
            <text
              x={margin.left}
              y={68}
              fontSize={11}
              fill={COLORS.lightText}
            >
              Q4 2023
            </text>
          </>
        )}

        {/* Zone labels at top - positioned to align with arc boundaries */}
        <g>
          {zones.map((zone, i) => {
            // Position labels above where the arcs would be
            const xRatio = (i + 0.5) / zones.length;
            const x = margin.left + xRatio * chartWidth * 0.85 + 20;
            const lines = zone.name.split("\n");
            return (
              <g key={zone.name}>
                {lines.map((line, lineIdx) => (
                  <text
                    key={lineIdx}
                    x={x}
                    y={margin.top - 25 + lineIdx * 14}
                    fontSize={11}
                    fontWeight={600}
                    fill={COLORS.text}
                    textAnchor="middle"
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}
        </g>

        {/* Curved quarter-circle zone bands */}
        <g clipPath="url(#chart-clip)">
          {/* Draw in reverse order so outer (leaders) is behind */}
          {[...zones].reverse().map((zone, i) => {
            const actualIndex = zones.length - 1 - i;
            return (
              <path
                key={zone.name}
                d={generateArcZonePath(
                  actualIndex,
                  zones.length,
                  margin.left,
                  margin.top,
                  chartWidth,
                  chartHeight
                )}
                fill={zone.color}
              />
            );
          })}
        </g>

        {/* Y-axis label */}
        <g>
          <text
            x={15}
            y={margin.top + chartHeight / 2 - 20}
            fontSize={10}
            fill={COLORS.lightText}
          >
            Strength
          </text>
          <text
            x={15}
            y={margin.top + chartHeight / 2 - 8}
            fontSize={10}
            fill={COLORS.lightText}
          >
            of offering
          </text>
        </g>

        {/* X-axis label */}
        <g>
          <text
            x={margin.left + chartWidth / 2}
            y={margin.top + chartHeight + 35}
            fontSize={10}
            fill={COLORS.lightText}
            textAnchor="middle"
          >
            Strength of strategy
          </text>
        </g>

        {/* Company bubbles */}
        {data.map((point, index) => {
          const cx = margin.left + (point.strategy / 100) * chartWidth;
          const cy = margin.top + chartHeight - (point.currentOffering / 100) * chartHeight;
          const radius = getBubbleRadius(point.marketPresence);
          const labelPos = labelPositions[index];

          return (
            <g key={`company-${index}`}>
              {/* Outer circle (white fill) */}
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill={COLORS.dotFill}
                stroke={COLORS.dotStroke}
                strokeWidth={1.5}
              />
              {/* Inner dot */}
              <circle
                cx={cx}
                cy={cy}
                r={2.5}
                fill={COLORS.dotCenter}
              />
              {/* Company label */}
              <text
                x={labelPos.x}
                y={labelPos.y}
                fontSize={LABEL_CONFIG.fontSize}
                fill={COLORS.text}
                textAnchor={labelPos.anchor}
                dominantBaseline="middle"
              >
                {point.company}
              </text>
            </g>
          );
        })}

        {/* Market presence legend (top right) */}
        <g transform={`translate(${width - 150}, ${margin.top - 50})`}>
          <text
            x={0}
            y={0}
            fontSize={9}
            fill={COLORS.lightText}
          >
            Market presence*
          </text>
          {[0, 1, 2, 3].map((i) => {
            const sizes = [25, 50, 75, 100];
            const radius = getBubbleRadius(sizes[i]);
            const x = 20 + i * 28;
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={16}
                  r={radius * 0.6}
                  fill="none"
                  stroke={COLORS.dotStroke}
                  strokeWidth={1}
                />
                <circle cx={x} cy={16} r={1.5} fill={COLORS.dotCenter} />
              </g>
            );
          })}
        </g>

        {/* Bright Data logo watermark */}
        <g transform={`translate(${width - 130}, ${height - 30})`}>
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
