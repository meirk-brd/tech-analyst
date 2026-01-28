import { NextResponse } from "next/server";

import { getSession, updateSession } from "@/lib/db/mongodb";
import { generateChartData } from "@/lib/agents/visualization/generate-chart-data";
import type { VisualizationScores } from "@/lib/agents/visualization/types";
import type { ScoredCompany } from "@/lib/agents/synthesis/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Session ID is required" },
      { status: 400 }
    );
  }

  try {
    const session = await getSession(id);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    let result = session.result;
    const visualizations = result?.visualizations;
    const hasChartData = !!visualizations?.chartData;
    const hasImages =
      !!visualizations?.quadrant || !!visualizations?.wave || !!visualizations?.radar;

    if (!hasChartData && !hasImages && Array.isArray(result?.scores) && result!.scores.length > 0) {
      const payload: VisualizationScores = (result!.scores as ScoredCompany[])
        .map((score) => ({
          company: score.company,
          vision: score.vision,
          execution: score.execution,
          quadrant: score.quadrant,
        }))
        .filter(
          (item) =>
            typeof item.company === "string" &&
            typeof item.vision === "number" &&
            typeof item.execution === "number" &&
            typeof item.quadrant === "string"
        ) as VisualizationScores;

      if (payload.length > 0 && visualizations) {
        const chartData = generateChartData(payload, {
          quadrantTitle: `Magic Quadrant for ${session.marketSector}`,
          waveSubtitle: session.marketSector,
          radarCategory: session.marketSector,
        });

        result = {
          ...result,
          visualizations: {
            ...visualizations,
            chartData,
          },
        };

        await updateSession(id, { result }).catch((error) => {
          console.error("Failed to backfill chart data:", error);
        });
      }
    }

    return NextResponse.json({
      id: session._id!.toString(),
      marketSector: session.marketSector,
      status: session.status,
      result,
      error: session.error,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    console.error("Failed to get session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
