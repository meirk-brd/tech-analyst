import { NextResponse } from "next/server";

import { parseVisualizationInput } from "@/lib/agents/visualization/parse-input";
import { generateChartData } from "@/lib/agents/visualization/generate-chart-data";
import {
  buildMagicQuadrantPrompt,
  buildForresterWavePrompt,
  buildGigaOmRadarPrompt,
} from "@/lib/agents/visualization/prompts";
import { generateImage } from "@/lib/agents/visualization/generate-image";
import { logVisualization } from "@/lib/agents/visualization/logger";

// Feature flag for Recharts-based visualization (default on; set USE_RECHARTS=false to use AI)
const USE_RECHARTS = process.env.USE_RECHARTS !== "false" && process.env.USE_RECHARTS !== "0";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const scores = parseVisualizationInput(body);

  if (!scores) {
    return NextResponse.json(
      { error: "scores is required (array of { company, vision, execution, quadrant })." },
      { status: 400 }
    );
  }

  logVisualization("request.start", { total: scores.length, useRecharts: USE_RECHARTS });

  // New: Recharts-based chart data generation
  if (USE_RECHARTS) {
    const options = body?.options ?? {};
    const chartData = generateChartData(scores, options);

    logVisualization("request.done", { mode: "recharts" });

    // Return chart data for client-side rendering
    return NextResponse.json({
      mode: "recharts",
      chartData,
    });
  }

  // Legacy: AI-based image generation
  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json(
      { error: "Missing GOOGLE_AI_API_KEY." },
      { status: 500 }
    );
  }

  const quadrantPrompt = buildMagicQuadrantPrompt(scores);
  const wavePrompt = buildForresterWavePrompt(scores);
  const radarPrompt = buildGigaOmRadarPrompt(scores);

  const [quadrant, wave, radar] = await Promise.all([
    generateImage(quadrantPrompt),
    generateImage(wavePrompt),
    generateImage(radarPrompt),
  ]);

  logVisualization("request.done", { mode: "ai" });

  return NextResponse.json({
    mode: "ai",
    quadrant,
    wave,
    radar,
  });
}
