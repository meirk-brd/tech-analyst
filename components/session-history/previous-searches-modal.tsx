"use client";

import { useEffect, useCallback } from "react";
import { X, History, RefreshCw } from "lucide-react";
import { useSessionHistory } from "@/hooks/use-session-history";
import { SessionItem } from "./session-item";

interface PreviousSearchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
}

export function PreviousSearchesModal({
  isOpen,
  onClose,
  onSelectSession,
}: PreviousSearchesModalProps) {
  const { sessions, isLoading, error, refresh } = useSessionHistory();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      refresh();
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown, refresh]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#091B36]/95 border border-[#29436E]/50 rounded-2xl shadow-2xl shadow-black/50 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#3D7FFC]/10 rounded-lg">
              <History className="w-5 h-5 text-[#3D7FFC]" />
            </div>
            <h2 className="text-white font-semibold text-lg">Previous Searches</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 bg-slate-900/40 border border-white/10 rounded-xl animate-pulse"
                >
                  <div className="h-5 w-48 bg-white/10 rounded mb-2" />
                  <div className="h-4 w-32 bg-white/5 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={refresh}
                className="inline-flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white border border-white/20 hover:border-white/30 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                <History className="w-8 h-8 text-white/30" />
              </div>
              <p className="text-white/50 text-sm">No previous searches yet</p>
              <p className="text-white/30 text-xs mt-1">
                Your completed analyses will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {sessions.length > 0 && !isLoading && (
          <div className="px-6 py-3 border-t border-white/10 flex justify-between items-center">
            <span className="text-white/40 text-sm">
              {sessions.length} saved {sessions.length === 1 ? "search" : "searches"}
            </span>
            <button
              onClick={refresh}
              className="text-white/50 hover:text-white text-sm flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
