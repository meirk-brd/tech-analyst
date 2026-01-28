"use client";

import { useMemo } from "react";
import type { RadarDataPoint, ChartDimensions, MovementType } from "@/lib/agents/visualization/chart-types";
import { DEFAULT_CHART_DIMENSIONS } from "@/lib/agents/visualization/chart-types";
import { basePath } from "@/lib/base-path";

interface GigaOmRadarChartProps {
  data: RadarDataPoint[];
  title?: string;
  category?: string;
  dimensions?: Partial<ChartDimensions>;
}

// Colors matching the GigaOm Radar reference
const COLORS = {
  // Concentric rings (outer to inner)
  ringOuter: "#E0E0E0", // Lightest gray (Entrant)
  ringMiddle: "#C8C8C8", // Medium gray (Challenger)
  ringInner: "#B0B0B0", // Darker gray (Leader)
  centerHole: "#FFFFFF", // White center

  // Axis lines
  axisLine: "#999999",

  // Movement arrows
  forwardMover: "#3B7DBD", // Blue
  fastMover: "#3B7DBD", // Blue
  outperformer: "#E86830", // Orange

  // Header
  headerBg: "#C84B31", // Red-orange
  headerText: "#FFFFFF",

  // Text
  text: "#333333",
  lightText: "#666666",

  background: "#FFFFFF",
};

// Label configuration
const LABEL_CONFIG = {
  fontSize: 10,
  charWidth: 5.5,
  lineHeight: 12,
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
  return !(
    a.x + a.width + 3 < b.x ||
    b.x + b.width + 3 < a.x ||
    a.y + a.height + 3 < b.y ||
    b.y + b.height + 3 < a.y
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
 * Convert polar coordinates to cartesian
 */
function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

/**
 * Get arrow path for movement indicator
 */
function getArrowPath(
  x: number,
  y: number,
  angle: number,
  length: number = 20
): string {
  const angleRad = (angle * Math.PI) / 180;
  const endX = x + length * Math.cos(angleRad);
  const endY = y + length * Math.sin(angleRad);

  // Arrow head
  const headLength = 6;
  const headAngle = 25;
  const head1Angle = angleRad + Math.PI + (headAngle * Math.PI) / 180;
  const head2Angle = angleRad + Math.PI - (headAngle * Math.PI) / 180;

  const head1X = endX + headLength * Math.cos(head1Angle);
  const head1Y = endY + headLength * Math.sin(head1Angle);
  const head2X = endX + headLength * Math.cos(head2Angle);
  const head2Y = endY + headLength * Math.sin(head2Angle);

  return `M ${x} ${y} L ${endX} ${endY} M ${endX} ${endY} L ${head1X} ${head1Y} M ${endX} ${endY} L ${head2X} ${head2Y}`;
}

/**
 * Get color for movement type
 */
function getMovementColor(movement: MovementType): string {
  switch (movement) {
    case "outperformer":
      return COLORS.outperformer;
    case "forward":
    case "fast":
      return COLORS.forwardMover;
    default:
      return COLORS.forwardMover;
  }
}

/**
 * Calculate label positions with collision avoidance
 */
function calculateLabelPositions(
  data: RadarDataPoint[],
  centerX: number,
  centerY: number,
  maxRadius: number
): LabelPosition[] {
  const positions: LabelPosition[] = data.map((point) => {
    const r = maxRadius * (1 - point.radius / 100 * 0.8); // Invert: 0 = outer, 100 = center
    const pos = polarToCartesian(centerX, centerY, r, point.angle);

    // Determine anchor based on angle
    let anchor: "start" | "end" | "middle" = "start";
    if (point.angle > 135 && point.angle < 225) {
      anchor = "end";
    } else if (point.angle >= 225 || point.angle <= 45) {
      anchor = "middle";
    }

    // Offset label from point
    const labelOffset = 15;
    const offsetAngle = point.angle;
    const labelPos = polarToCartesian(pos.x, pos.y, labelOffset, offsetAngle);

    return {
      x: labelPos.x,
      y: labelPos.y,
      anchor,
      company: point.company,
    };
  });

  // Collision avoidance
  const placedBounds: BoundingBox[] = [];

  for (let i = 0; i < positions.length; i++) {
    const point = data[i];
    const r = maxRadius * (1 - point.radius / 100 * 0.8);
    const basePos = polarToCartesian(centerX, centerY, r, point.angle);

    const offsets = [15, 25, 35, -15, -25];
    const anchors: Array<"start" | "end" | "middle"> = ["start", "end", "middle"];

    let bestPos = positions[i];
    let foundGood = false;

    for (const offset of offsets) {
      for (const anchor of anchors) {
        const labelPos = polarToCartesian(basePos.x, basePos.y, Math.abs(offset), offset > 0 ? point.angle : point.angle + 180);
        const candidate: LabelPosition = {
          x: labelPos.x,
          y: labelPos.y,
          anchor,
          company: point.company,
        };

        const bounds = getLabelBounds(candidate);
        const hasOverlap = placedBounds.some((placed) => boxesOverlap(bounds, placed));

        if (!hasOverlap) {
          bestPos = candidate;
          foundGood = true;
          break;
        }
      }
      if (foundGood) break;
    }

    positions[i] = bestPos;
    placedBounds.push(getLabelBounds(bestPos));
  }

  return positions;
}

export function GigaOmRadarChart({
  data,
  title = "RADAR REPORT",
  category = "Technology Analysis",
  dimensions,
}: GigaOmRadarChartProps) {
  const config = useMemo(() => {
    const width = dimensions?.width ?? DEFAULT_CHART_DIMENSIONS.width;
    const height = dimensions?.height ?? DEFAULT_CHART_DIMENSIONS.height;
    const margin = {
      top: 80,
      right: 120,
      bottom: 80,
      left: 40,
    };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const centerX = margin.left + chartWidth / 2;
    const centerY = margin.top + chartHeight / 2;
    const maxRadius = Math.min(chartWidth, chartHeight) / 2 - 20;

    return { width, height, margin, chartWidth, chartHeight, centerX, centerY, maxRadius };
  }, [dimensions]);

  const { width, height, margin, centerX, centerY, maxRadius } = config;

  const labelPositions = useMemo(
    () => calculateLabelPositions(data, centerX, centerY, maxRadius),
    [data, centerX, centerY, maxRadius]
  );

  // Ring radii (3 rings)
  const ringRadii = [
    maxRadius, // Outer (Entrant)
    maxRadius * 0.66, // Middle (Challenger)
    maxRadius * 0.33, // Inner (Leader)
  ];
  const centerHoleRadius = maxRadius * 0.12;

  // Axis labels
  const axisLabels = [
    { label: "MATURITY", angle: 0 },
    { label: "PLATFORM PLAY", angle: 90 },
    { label: "INNOVATION", angle: 180 },
    { label: "FEATURE PLAY", angle: 270 },
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
        {/* Header box */}
        <g>
          <rect
            x={margin.left}
            y={15}
            width={140}
            height={40}
            fill={COLORS.headerBg}
          />
          <text
            x={margin.left + 10}
            y={40}
            fontSize={10}
            fontWeight={700}
            fill={COLORS.headerText}
          >
            RADAR REPORT
          </text>
        </g>

        {/* Category label */}
        <g>
          <rect
            x={margin.left}
            y={58}
            width={180}
            height={22}
            fill={COLORS.headerBg}
            opacity={0.9}
          />
          <text
            x={margin.left + 10}
            y={73}
            fontSize={10}
            fontWeight={600}
            fill={COLORS.headerText}
          >
            {category.toUpperCase()}
          </text>
        </g>

        {/* Concentric rings */}
        <g>
          {/* Outer ring (Entrant) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={ringRadii[0]}
            fill={COLORS.ringOuter}
            stroke="none"
          />
          {/* Middle ring (Challenger) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={ringRadii[1]}
            fill={COLORS.ringMiddle}
            stroke="none"
          />
          {/* Inner ring (Leader) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={ringRadii[2]}
            fill={COLORS.ringInner}
            stroke="none"
          />
          {/* Center hole */}
          <circle
            cx={centerX}
            cy={centerY}
            r={centerHoleRadius}
            fill={COLORS.centerHole}
            stroke="none"
          />
        </g>

        {/* Axis lines */}
        <g>
          {axisLabels.map((axis) => {
            const outerPoint = polarToCartesian(centerX, centerY, maxRadius + 5, axis.angle);
            const innerPoint = polarToCartesian(centerX, centerY, centerHoleRadius, axis.angle);
            return (
              <line
                key={axis.label}
                x1={innerPoint.x}
                y1={innerPoint.y}
                x2={outerPoint.x}
                y2={outerPoint.y}
                stroke={COLORS.axisLine}
                strokeWidth={1}
              />
            );
          })}
        </g>

        {/* Axis labels */}
        <g>
          {axisLabels.map((axis) => {
            const labelRadius = maxRadius + 25;
            const pos = polarToCartesian(centerX, centerY, labelRadius, axis.angle);
            let anchor: "start" | "end" | "middle" = "middle";
            let dy = 0;

            if (axis.angle === 0) {
              dy = -5;
            } else if (axis.angle === 180) {
              dy = 15;
            } else if (axis.angle === 90) {
              anchor = "start";
            } else if (axis.angle === 270) {
              anchor = "end";
            }

            return (
              <text
                key={axis.label}
                x={pos.x}
                y={pos.y + dy}
                fontSize={11}
                fontWeight={600}
                fill={COLORS.text}
                textAnchor={anchor}
                dominantBaseline="middle"
              >
                {axis.label}
              </text>
            );
          })}
        </g>

        {/* Company points and arrows */}
        {data.map((point, index) => {
          // Convert radius: 0 = outer edge, 100 = center
          // So we invert: higher radius value = closer to center
          const r = maxRadius * (1 - point.radius / 100 * 0.85);
          const pos = polarToCartesian(centerX, centerY, r, point.angle);
          const labelPos = labelPositions[index];

          return (
            <g key={`company-${index}`}>
              {/* Movement arrow */}
              {point.movement && point.movementAngle !== undefined && (
                <path
                  d={getArrowPath(pos.x, pos.y, point.movementAngle - 90, 18)}
                  stroke={getMovementColor(point.movement)}
                  strokeWidth={2}
                  fill="none"
                />
              )}

              {/* Company label */}
              <text
                x={labelPos.x}
                y={labelPos.y}
                fontSize={LABEL_CONFIG.fontSize}
                fill={point.movement === "outperformer" ? COLORS.outperformer : COLORS.forwardMover}
                textAnchor={labelPos.anchor}
                dominantBaseline="middle"
                fontWeight={500}
              >
                {point.company}
              </text>
            </g>
          );
        })}

        {/* Legend - top right */}
        <g transform={`translate(${width - 110}, ${margin.top})`}>
          {[
            { label: "Leader", color: COLORS.ringInner, r: 8 },
            { label: "Challenger", color: COLORS.ringMiddle, r: 10 },
            { label: "Entrant", color: COLORS.ringOuter, r: 12 },
          ].map((item, i) => (
            <g key={item.label} transform={`translate(0, ${i * 25})`}>
              <circle
                cx={12}
                cy={0}
                r={item.r}
                fill={item.color}
                stroke="#999"
                strokeWidth={0.5}
              />
              <text
                x={30}
                y={4}
                fontSize={10}
                fill={COLORS.text}
              >
                {item.label}
              </text>
            </g>
          ))}
        </g>

        {/* Movement legend - bottom right */}
        <g transform={`translate(${width - 140}, ${height - 90})`}>
          {[
            { label: "Forward Mover", color: COLORS.forwardMover, arrows: 2 },
            { label: "Fast Mover", color: COLORS.fastMover, arrows: 1 },
            { label: "Outperformer", color: COLORS.outperformer, arrows: 1 },
          ].map((item, i) => (
            <g key={item.label} transform={`translate(0, ${i * 20})`}>
              <path
                d={`M 0 0 L 15 0 M 15 0 L 11 -3 M 15 0 L 11 3`}
                stroke={item.color}
                strokeWidth={2}
                fill="none"
              />
              {item.arrows === 2 && (
                <path
                  d={`M 5 0 L 1 -3 M 5 0 L 1 3`}
                  stroke={item.color}
                  strokeWidth={2}
                  fill="none"
                />
              )}
              <text
                x={25}
                y={4}
                fontSize={10}
                fill={item.color}
                fontWeight={500}
              >
                {item.label}
              </text>
            </g>
          ))}
        </g>

        {/* Source footer */}
        <text
          x={margin.left}
          y={height - 15}
          fontSize={9}
          fill={COLORS.lightText}
        >
          Source: Tech Analyst {new Date().getFullYear()}
        </text>

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
