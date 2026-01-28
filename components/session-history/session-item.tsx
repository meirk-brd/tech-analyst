"use client";

import { Clock, Building2, ChevronRight } from "lucide-react";
import type { SessionListItem } from "@/hooks/use-session-history";

interface SessionItemProps {
  session: SessionListItem;
  onClick: () => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function SessionItem({ session, onClick }: SessionItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-slate-900/40 border border-white/10 rounded-xl hover:border-[#3D7FFC]/30 hover:bg-slate-900/60 transition-all duration-200 group"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {/* Market Sector */}
          <h4 className="text-white font-medium truncate group-hover:text-[#3D7FFC] transition-colors">
            {session.marketSector}
          </h4>

          {/* Meta info */}
          <div className="flex items-center gap-4 mt-1.5">
            <span className="flex items-center gap-1.5 text-white/50 text-sm">
              <Clock className="w-3.5 h-3.5" />
              {formatRelativeTime(session.createdAt)}
            </span>
            <span className="flex items-center gap-1.5 text-white/50 text-sm">
              <Building2 className="w-3.5 h-3.5" />
              {session.companyCount} companies
            </span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-[#3D7FFC] group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}
