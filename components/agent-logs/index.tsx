"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { LogEntry } from "./log-entry";
import type { LogEntry as LogEntryType } from "@/hooks/use-analysis";

interface AgentLogsProps {
  logs: LogEntryType[];
  isActive?: boolean;
  defaultCollapsed?: boolean;
}

export function AgentLogs({
  logs,
  isActive = false,
  defaultCollapsed = false,
}: AgentLogsProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current && !isCollapsed) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isCollapsed]);

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-white font-medium flex items-center gap-2">
          Agent logs
          {isActive && (
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </h3>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-white/60 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
        >
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Log entries */}
      {!isCollapsed && (
        <div
          ref={scrollRef}
          className="p-4 space-y-1 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        >
          {logs.length === 0 ? (
            <div className="space-y-1">
              <p className="text-white/40 text-sm font-mono flex items-center gap-2">
                <span className="w-2 h-2 bg-white/30 rounded-full animate-pulse" />
                Connecting to analysis pipeline...
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <LogEntry
                key={log.id}
                type={log.type}
                message={log.message}
                progress={log.progress}
                total={log.total}
                company={log.company}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
