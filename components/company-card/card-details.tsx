"use client";

import { ExternalLink } from "lucide-react";
import type { ExtractedCompanyData } from "@/lib/agents/extraction/types";
import { ScoreBreakdown } from "./score-breakdown";
import type { ScoreBreakdown as ScoreBreakdownType } from "@/lib/agents/synthesis/types";

interface CardDetailsProps {
  data: ExtractedCompanyData;
  breakdown: ScoreBreakdownType;
}

export function CardDetails({ data, breakdown }: CardDetailsProps) {
  return (
    <div className="p-5 bg-slate-900/30 border-t border-white/5 space-y-6">
      {/* Top grid - Company info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Business Model */}
        <div>
          <h4 className="text-white/40 text-xs uppercase tracking-wider mb-1">
            Business Model
          </h4>
          <p className="text-white/80 text-sm">{data.businessModel || "N/A"}</p>
        </div>

        {/* Location & Founded */}
        <div>
          <h4 className="text-white/40 text-xs uppercase tracking-wider mb-1">
            Headquarters
          </h4>
          <p className="text-white/80 text-sm">{data.headquarters || "N/A"}</p>
          {data.foundingYear && (
            <p className="text-white/60 text-xs mt-1">
              Founded {data.foundingYear}
            </p>
          )}
        </div>

        {/* Enterprise Customers */}
        <div>
          <h4 className="text-white/40 text-xs uppercase tracking-wider mb-1">
            Enterprise Customers
          </h4>
          <p className="text-white/80 text-sm">
            {data.enterpriseCustomers?.length > 0
              ? data.enterpriseCustomers.slice(0, 3).join(", ")
              : "N/A"}
          </p>
        </div>
      </div>

      {/* Pricing Tiers */}
      {data.pricingTiers && data.pricingTiers.length > 0 && (
        <div>
          <h4 className="text-white/40 text-xs uppercase tracking-wider mb-2">
            Pricing Tiers
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.pricingTiers.map((tier, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white/70 text-xs"
              >
                {tier}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key Features */}
      {data.keyFeatures && data.keyFeatures.length > 0 && (
        <div>
          <h4 className="text-white/40 text-xs uppercase tracking-wider mb-2">
            Key Features
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.keyFeatures.slice(0, 6).map((feature, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-[#3D7FFC]/10 border border-[#3D7FFC]/20 rounded text-[#3D7FFC] text-xs"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Technical Capabilities */}
      {data.technicalCapabilities && (
        <div>
          <h4 className="text-white/40 text-xs uppercase tracking-wider mb-2">
            Technical Capabilities
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            {data.technicalCapabilities.scalability && (
              <div>
                <span className="text-white/50">Scalability: </span>
                <span className="text-white/80">
                  {data.technicalCapabilities.scalability}
                </span>
              </div>
            )}
            {data.technicalCapabilities.security && (
              <div>
                <span className="text-white/50">Security: </span>
                <span className="text-white/80">
                  {data.technicalCapabilities.security}
                </span>
              </div>
            )}
            {data.technicalCapabilities.integrations?.length > 0 && (
              <div>
                <span className="text-white/50">Integrations: </span>
                <span className="text-white/80">
                  {data.technicalCapabilities.integrations.slice(0, 3).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      <ScoreBreakdown breakdown={breakdown} />

      {/* Source Links */}
      {data.sources && Object.values(data.sources).some(Boolean) && (
        <div>
          <h4 className="text-white/40 text-xs uppercase tracking-wider mb-2">
            Sources
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.sources.pricing && (
              <a
                href={data.sources.pricing}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-white/70 text-xs hover:bg-white/10 hover:text-white transition-colors"
              >
                Pricing <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {data.sources.docs && (
              <a
                href={data.sources.docs}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-white/70 text-xs hover:bg-white/10 hover:text-white transition-colors"
              >
                Docs <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {data.sources.about && (
              <a
                href={data.sources.about}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-white/70 text-xs hover:bg-white/10 hover:text-white transition-colors"
              >
                About <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
