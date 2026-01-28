"use client";

import { useState, useMemo } from "react";
import type { ScoredCompany } from "@/lib/agents/synthesis/types";
import { CompanyCard } from "./company-card";

interface CompanyGridProps {
  companies: ScoredCompany[];
}

type SortOption = "name" | "vision" | "execution" | "quadrant";
type QuadrantFilter = ScoredCompany["quadrant"] | "all";

const QUADRANT_ORDER: ScoredCompany["quadrant"][] = [
  "Leaders",
  "Challengers",
  "Visionaries",
  "Niche Players",
];

export function CompanyGrid({ companies }: CompanyGridProps) {
  const [sortBy, setSortBy] = useState<SortOption>("vision");
  const [filterQuadrant, setFilterQuadrant] = useState<QuadrantFilter>("all");

  const filteredAndSorted = useMemo(() => {
    let result = [...companies];

    // Filter
    if (filterQuadrant !== "all") {
      result = result.filter((c) => c.quadrant === filterQuadrant);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.company.localeCompare(b.company);
        case "vision":
          return b.vision - a.vision;
        case "execution":
          return b.execution - a.execution;
        case "quadrant":
          return (
            QUADRANT_ORDER.indexOf(a.quadrant) -
            QUADRANT_ORDER.indexOf(b.quadrant)
          );
        default:
          return 0;
      }
    });

    return result;
  }, [companies, sortBy, filterQuadrant]);

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Results count */}
        <p className="text-white/60 text-sm">
          Showing <span className="text-white">{filteredAndSorted.length}</span>{" "}
          {filteredAndSorted.length === 1 ? "company" : "companies"}
          {filterQuadrant !== "all" && (
            <span> in {filterQuadrant}</span>
          )}
        </p>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-slate-900/60 border border-white/10 rounded-lg px-3 py-1.5 text-white/80 text-sm focus:border-[#3D7FFC]/50 focus:ring-1 focus:ring-[#3D7FFC]/20 outline-none"
          >
            <option value="vision">Sort by Vision</option>
            <option value="execution">Sort by Execution</option>
            <option value="name">Sort by Name</option>
            <option value="quadrant">Sort by Quadrant</option>
          </select>
        </div>
      </div>

      {/* Quadrant filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterQuadrant("all")}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            filterQuadrant === "all"
              ? "bg-[#3D7FFC]/20 border border-[#3D7FFC]/30 text-[#3D7FFC]"
              : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          All
        </button>
        {QUADRANT_ORDER.map((quadrant) => {
          const count = companies.filter((c) => c.quadrant === quadrant).length;
          return (
            <button
              key={quadrant}
              onClick={() => setFilterQuadrant(quadrant)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filterQuadrant === quadrant
                  ? "bg-[#3D7FFC]/20 border border-[#3D7FFC]/30 text-[#3D7FFC]"
                  : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {quadrant} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredAndSorted.map((company, index) => (
          <CompanyCard
            key={`${company.company}-${company.url}`}
            company={company}
            animationDelay={index * 100}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredAndSorted.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/40">No companies match the current filter.</p>
        </div>
      )}
    </div>
  );
}
