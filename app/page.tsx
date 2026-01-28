"use client";

import { useState, useRef } from "react";
import {
  LeftSideDecoration,
  RightSideDecoration,
} from "@/components/background-sides";
import { NavBar } from "@/components/nav-bar";
import { HeroSection } from "@/components/hero-section";
import { SearchInput } from "@/components/search-input";
import { SearchTips } from "@/components/search-tips";
import { AgentLogs } from "@/components/agent-logs";
import { ProgressStepper } from "@/components/agent-logs/progress-stepper";
import { CompanyGrid } from "@/components/company-grid";
import { VisualizationsGrid } from "@/components/visualizations";
import { ExportButton } from "@/components/export-button";
import { PreviousSearchesModal } from "@/components/session-history/previous-searches-modal";
import { RateLimitModal } from "@/components/rate-limit-modal";
import { useAnalysis } from "@/hooks/use-analysis";
import { useSessionLoader } from "@/hooks/use-session-loader";

export default function Home() {
  const {
    isLoading,
    currentStage,
    logs,
    result,
    error,
    isRateLimited,
    setIsRateLimited,
    startAnalysis,
    reset,
  } = useAnalysis();

  const { loadSession, isLoading: isLoadingSession } = useSessionLoader();

  const [searchQuery, setSearchQuery] = useState("");
  const [showPreviousSearches, setShowPreviousSearches] = useState(false);
  const [loadedFromHistory, setLoadedFromHistory] = useState(false);
  const [loadedResult, setLoadedResult] = useState<typeof result>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setLoadedFromHistory(false);
    setLoadedResult(null);
    startAnalysis(query);
  };

  const handleExampleClick = (example: string) => {
    setSearchQuery(example);
    setLoadedFromHistory(false);
    setLoadedResult(null);
    startAnalysis(example);
  };

  const handleSelectSession = async (sessionId: string) => {
    reset();
    setLoadedFromHistory(true);
    const sessionResult = await loadSession(sessionId);
    if (sessionResult) {
      setLoadedResult(sessionResult);
      setSearchQuery(sessionResult.marketSector);
    }
  };

  // Use loaded result if available, otherwise use analysis result
  const displayResult = loadedFromHistory ? loadedResult : result;

  // Scroll to results when analysis starts
  const hasResults = displayResult?.scores && displayResult.scores.length > 0;
  const hasVisualizations = displayResult?.visualizations;
  const showResultsSection = isLoading || isLoadingSession || hasResults || error;

  return (
    <div className="min-h-screen bg-[#091B36] text-white">
      {/* Side decorations */}
      <LeftSideDecoration />
      <RightSideDecoration />

      {/* Background layers */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Ambient glow at top */}
        <div className="absolute inset-0 bg-glow" />
        {/* Grid pattern - only in center area */}
        <div className="absolute inset-0 lg:left-[220px] lg:right-[220px] bg-grid-pattern opacity-100" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <NavBar onPreviousSearchesClick={() => setShowPreviousSearches(true)} />

        {/* Previous Searches Modal */}
        <PreviousSearchesModal
          isOpen={showPreviousSearches}
          onClose={() => setShowPreviousSearches(false)}
          onSelectSession={handleSelectSession}
        />

        {/* Rate Limit Modal */}
        <RateLimitModal
          isOpen={isRateLimited}
          onClose={() => setIsRateLimited(false)}
        />

        {/* Hero section */}
        <main className="pt-24 pb-16">
          <HeroSection>
            <SearchInput
              onSearch={handleSearch}
              isLoading={isLoading}
            />
            <SearchTips onExampleClick={handleExampleClick} />
          </HeroSection>

          {/* Results section */}
          {showResultsSection && (
            <div ref={resultsRef} className="max-w-7xl mx-auto px-4 lg:px-8 mt-8">
              {/* Progress stepper */}
              {(isLoading || currentStage) && (
                <div className="mb-6 bg-slate-900/50 border border-white/10 rounded-xl p-4">
                  <ProgressStepper currentStage={currentStage} />
                </div>
              )}

              {/* Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
                {/* Left sidebar - Agent logs */}
                <div className="lg:sticky lg:top-24 lg:self-start">
                  <AgentLogs logs={logs} isActive={isLoading} />
                </div>

                {/* Right main content */}
                <div className="space-y-8">
                  {/* Error banner */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <h3 className="text-red-400 font-medium">Analysis Failed</h3>
                        <p className="text-red-400/70 text-sm mt-1">{error}</p>
                        <button
                          onClick={() => handleSearch(searchQuery)}
                          className="mt-3 px-4 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 text-sm rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Visualizations */}
                  {hasVisualizations && (
                    <VisualizationsGrid visualizations={displayResult!.visualizations} />
                  )}

                  {/* Results header with export */}
                  {hasResults && (
                    <div className="flex items-center justify-between">
                      <div className="text-white/60 text-sm">
                        Showing <span className="text-white">{displayResult!.scores.length}</span> companies
                        <span className="mx-2">•</span>
                        {loadedFromHistory ? (
                          <span className="text-[#3D7FFC]">From history</span>
                        ) : (
                          "Fresh analysis"
                        )}
                        <span className="mx-2">•</span>
                        <span className="text-white">{searchQuery}</span>
                      </div>
                      <ExportButton
                        csv={displayResult!.csv}
                        marketSector={searchQuery}
                      />
                    </div>
                  )}

                  {/* Company grid */}
                  {hasResults && (
                    <CompanyGrid companies={displayResult!.scores} />
                  )}

                  {/* Loading skeleton */}
                  {(isLoading || isLoadingSession) && !hasResults && (
                    <div className="space-y-4">
                      <div className="text-white/60 text-sm text-center">
                        {isLoadingSession ? "Loading previous analysis..." : "Analyzing market sector..."}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div
                            key={i}
                            className="bg-slate-900/60 border border-white/10 rounded-xl p-5 animate-pulse"
                          >
                            <div className="h-6 bg-slate-800/50 rounded w-3/4 mb-2" />
                            <div className="h-4 bg-slate-800/50 rounded w-1/2 mb-4" />
                            <div className="space-y-2">
                              <div className="h-2 bg-slate-800/50 rounded" />
                              <div className="h-2 bg-slate-800/50 rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="py-6 text-center border-t border-white/5">
          <p className="text-white/40 text-sm">
            Powered by{" "}
            <span className="text-white/60">Bright Data</span> &{" "}
            <span className="text-white/60">Mongo DB</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
