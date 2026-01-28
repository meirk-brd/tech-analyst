"use client";

import type { ScoreBreakdown as ScoreBreakdownType } from "@/lib/agents/synthesis/types";

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownType;
}

const METRIC_LABELS: Record<keyof ScoreBreakdownType, string> = {
  featureDepth: "Feature Depth",
  innovation: "Innovation",
  positioning: "Positioning",
  pricingMaturity: "Pricing Maturity",
  enterprisePresence: "Enterprise Presence",
  documentationQuality: "Documentation",
  viability: "Viability",
};

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const entries = Object.entries(breakdown) as [keyof ScoreBreakdownType, number][];

  return (
    <div className="space-y-2">
      <h4 className="text-white/40 text-xs uppercase tracking-wider mb-3">
        Score Breakdown
      </h4>
      <div className="space-y-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-white/60 text-xs w-28 flex-shrink-0">
              {METRIC_LABELS[key]}
            </span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#9D97F4] via-[#3D7FFC] to-[#15C1E6] rounded-full transition-all duration-500"
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="text-white/80 text-xs w-8 text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
