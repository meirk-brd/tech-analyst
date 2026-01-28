import { NextResponse } from "next/server";

import { parseVisualizationInput } from "@/lib/agents/visualization/parse-input";
import { generateChartData } from "@/lib/agents/visualization/generate-chart-data";
import { logVisualization } from "@/lib/agents/visualization/logger";

/**
 * POST /api/agents/visualization/charts
 *
 * Returns chart data for client-side rendering with Recharts.
 * This is the new endpoint that replaces AI-based image generation.
 *
 * Request body:
 * {
 *   scores: Array<{ company, vision, execution, quadrant }>,
 *   options?: {
 *     quadrantTitle?: string,
 *     waveSubtitle?: string,
 *     radarCategory?: string
 *   }
 * }
 *
 * Response:
 * {
 *   quadrant: { type, data, title },
 *   wave: { type, data, subtitle },
 *   radar: { type, data, category }
 * }
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const scores = parseVisualizationInput(body);

  if (!scores) {
    return NextResponse.json(
      { error: "scores is required (array of { company, vision, execution, quadrant })." },
      { status: 400 }
    );
  }

  logVisualization("charts.request", { total: scores.length });

  const options = body?.options ?? {};
  const chartData = generateChartData(scores, options);

  logVisualization("charts.response", {
    quadrant: chartData.quadrant.data.length,
    wave: chartData.wave.data.length,
    radar: chartData.radar.data.length,
  });

  return NextResponse.json(chartData);
}
