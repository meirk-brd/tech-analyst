"use client";

import { Check, Loader2 } from "lucide-react";
import type { AnalysisStatus } from "@/lib/agents/orchestration/types";

interface ProgressStepperProps {
  currentStage: AnalysisStatus | null;
}

const STAGES: { key: AnalysisStatus; label: string }[] = [
  { key: "discovery", label: "Discovery" },
  { key: "enrichment", label: "Enrichment" },
  { key: "extraction", label: "Extraction" },
  { key: "synthesis", label: "Synthesis" },
  { key: "visualization", label: "Visualization" },
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

export function ProgressStepper({ currentStage }: ProgressStepperProps) {
  return (
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
  );
}
