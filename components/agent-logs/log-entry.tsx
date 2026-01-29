"use client";

import type { LogType } from "@/hooks/use-analysis";

interface LogEntryProps {
  type: LogType;
  message: string;
  animate?: boolean;
  progress?: number;
  total?: number;
  company?: string;
}

const prefixStyles: Record<LogType, string> = {
  info: "text-blue-400",
  api: "text-purple-400",
  warn: "text-amber-400",
  done: "text-green-400",
  action: "text-cyan-400",
  error: "text-red-400",
};

export function LogEntry({
  type,
  message,
  animate = true,
  progress,
  total,
  company,
}: LogEntryProps) {
  const prefix = `[${type.toUpperCase()}]`;
  const hasProgress = typeof progress === "number" && typeof total === "number" && total > 0;
  const progressPercent = hasProgress ? Math.round((progress / total) * 100) : 0;

  return (
    <div
      className={`flex flex-col gap-1 font-mono text-sm ${animate ? "animate-slide-in-left" : ""}`}
    >
      <div className="flex items-center">
        <span
          className={`${prefixStyles[type]} font-medium w-20 flex-shrink-0`}
        >
          {prefix}
        </span>
        <span className="text-white/70 flex-1">{message}</span>
        {company && (
          <span className="text-white/40 text-xs ml-2 px-1.5 py-0.5 bg-white/5 rounded">
            {company}
          </span>
        )}
      </div>
      {hasProgress && (
        <div className="ml-20 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden max-w-48">
            <div
              className="h-full bg-[#3D7FFC] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-white/40 text-xs tabular-nums">
            {progress}/{total}
          </span>
        </div>
      )}
    </div>
  );
}
