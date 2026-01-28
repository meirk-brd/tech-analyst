"use client";

import type { LogType } from "@/hooks/use-analysis";

interface LogEntryProps {
  type: LogType;
  message: string;
  animate?: boolean;
}

const prefixStyles: Record<LogType, string> = {
  info: "text-blue-400",
  api: "text-purple-400",
  warn: "text-amber-400",
  done: "text-green-400",
  action: "text-cyan-400",
  error: "text-red-400",
};

export function LogEntry({ type, message, animate = true }: LogEntryProps) {
  const prefix = `[${type.toUpperCase()}]`;

  return (
    <div
      className={`flex font-mono text-sm ${animate ? "animate-slide-in-left" : ""}`}
    >
      <span
        className={`${prefixStyles[type]} font-medium w-20 flex-shrink-0`}
      >
        {prefix}
      </span>
      <span className="text-white/70">{message}</span>
    </div>
  );
}
