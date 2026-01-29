"use client";

import { ReactNode } from "react";

interface HeroSectionProps {
  children?: ReactNode;
}

export function HeroSection({ children }: HeroSectionProps) {
  return (
    <section className="text-center px-4 py-20">
      {/* CTA Button */}
      <div className="mb-8">
        <a
          href="https://brightdata.com/?hs_signup=1&utm_source=demo&utm_medium=market-analyst&utm_campaign=market-analyst&promo=market-analyst"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#9D97F4] via-[#3D7FFC] to-[#15C1E6] text-white font-medium text-sm rounded-lg shadow-lg shadow-[#3D7FFC]/20 hover:shadow-[#3D7FFC]/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          Claim free credits
        </a>
      </div>

      {/* Title */}
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
        Market Landscape Agent
      </h1>

      {/* Subtitle */}
      <p className="text-white/60 text-center max-w-2xl mx-auto mb-12 text-lg">
      Discover 100+ sources and ingest live web data to reveal how an AI perceives a market category. The agent analyzes this public evidence to construct a ground-truth competitive landscape, translating its findings into interactive Quadrants and Radars based entirely on real-time data.
      </p>

      {/* Search area - passed as children */}
      {children}
    </section>
  );
}
