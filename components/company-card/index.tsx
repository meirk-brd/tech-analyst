"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { ScoredCompany } from "@/lib/agents/synthesis/types";
import { ScoreDisplay } from "./score-display";
import { CardDetails } from "./card-details";

interface CompanyCardProps {
  company: ScoredCompany;
  animationDelay?: number;
}

const QUADRANT_STYLES: Record<
  ScoredCompany["quadrant"],
  { bg: string; text: string; border: string }
> = {
  Leaders: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/30",
  },
  Challengers: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  Visionaries: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  "Niche Players": {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
};

export function CompanyCard({ company, animationDelay = 0 }: CompanyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const quadrantStyle = QUADRANT_STYLES[company.quadrant];

  return (
    <div
      className="bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm hover:border-white/20 hover:bg-slate-900/70 transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-lg truncate">
              {company.company}
            </h3>
            <a
              href={company.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 text-sm hover:text-white/80 transition-colors flex items-center gap-1 mt-0.5"
            >
              <span className="truncate">{company.url}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>

          {/* Quadrant badge */}
          <span
            className={`
              px-2 py-1 rounded text-xs font-medium flex-shrink-0 ml-2
              ${quadrantStyle.bg} ${quadrantStyle.text} border ${quadrantStyle.border}
            `}
          >
            {company.quadrant}
          </span>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <ScoreDisplay label="Vision" value={company.vision} />
          <ScoreDisplay label="Execution" value={company.execution} />
        </div>

        {/* Expand/collapse button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 w-full flex items-center justify-center gap-1 py-2 text-white/60 text-sm hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <>
              Hide details <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              View details <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Expanded details */}
      {isExpanded && company.raw && (
        <CardDetails data={company.raw} breakdown={company.breakdown} />
      )}
    </div>
  );
}
