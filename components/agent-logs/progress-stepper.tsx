"use client";

import { Check, Loader2 } from "lucide-react";
import type { AnalysisStatus } from "@/lib/agents/orchestration/types";
import type { SubstageInfo } from "@/hooks/use-analysis";

interface ProgressStepperProps {
  currentStage: AnalysisStatus | null;
  currentSubstage?: SubstageInfo | null;
}

const STAGES: { key: AnalysisStatus; label: string; description: string }[] = [
  { key: "discovery", label: "Discovery", description: "Finding companies via search" },
  { key: "enrichment", label: "Enrichment", description: "Scraping company websites" },
  { key: "extraction", label: "Extraction", description: "Extracting intelligence" },
  { key: "synthesis", label: "Synthesis", description: "Scoring & ranking" },
  { key: "visualization", label: "Visualization", description: "Generating charts" },
];

function getStageStatus(
  stageKey: AnalysisStatus,
  currentStage: AnalysisStatus | null
): "pending" | "active" | "completed" {
  if (!currentStage) return "pending";

  const stageOrder = STAGES.map((s) => s.key);
  const currentIndex = stageOrder.indexOf(currentStage);
  const stageIndex = stageOrder.indexOf(stageKey);

  if (currentStage === "completed" || currentStage === "failed") {
    return stageIndex <= stageOrder.indexOf("visualization")
      ? "completed"
      : "pending";
  }

  if (stageIndex < currentIndex) return "completed";
  if (stageIndex === currentIndex) return "active";
  return "pending";
}

export function ProgressStepper({ currentStage, currentSubstage }: ProgressStepperProps) {
  const activeStage = STAGES.find((s) => s.key === currentStage);
  const hasProgress = currentSubstage?.progress !== undefined && currentSubstage?.total !== undefined && currentSubstage.total > 0;
  const progressPercent = hasProgress ? Math.round((currentSubstage!.progress! / currentSubstage!.total!) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Active stage description with substage details */}
      {activeStage && currentStage !== "completed" && currentStage !== "failed" && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-[#3D7FFC]" />
            <span className="text-white/70">
              {currentSubstage ? currentSubstage.message : activeStage.description}
            </span>
            {currentSubstage?.company && (
              <span className="text-white/40 text-xs px-1.5 py-0.5 bg-white/5 rounded">
                {currentSubstage.company}
              </span>
            )}
          </div>
          {/* Progress bar for substage */}
          {hasProgress && (
            <div className="flex items-center gap-3 w-full max-w-xs">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3D7FFC] rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-white/40 text-xs tabular-nums min-w-[3rem] text-right">
                {currentSubstage!.progress}/{currentSubstage!.total}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-1 px-2 py-3">
        {STAGES.map((stage, index) => {
          const status = getStageStatus(stage.key, currentStage);

          return (
            <div key={stage.key} className="flex items-center flex-1">
              {/* Step indicator */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                    transition-all duration-300
                    ${
                      status === "completed"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : status === "active"
                        ? "bg-[#3D7FFC]/20 text-[#3D7FFC] border border-[#3D7FFC]/30"
                        : "bg-white/5 text-white/30 border border-white/10"
                    }
                  `}
                >
                  {status === "completed" ? (
                    <Check className="w-4 h-4" />
                  ) : status === "active" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={`
                    text-xs whitespace-nowrap
                    ${
                      status === "completed"
                        ? "text-green-400"
                        : status === "active"
                        ? "text-[#3D7FFC]"
                        : "text-white/30"
                    }
                  `}
                >
                  {stage.label}
                </span>
              </div>

              {/* Connecting line */}
              {index < STAGES.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-2 mt-[-16px]
                    transition-colors duration-300
                    ${
                      getStageStatus(STAGES[index + 1].key, currentStage) !== "pending"
                        ? "bg-green-500/30"
                        : "bg-white/10"
                    }
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
