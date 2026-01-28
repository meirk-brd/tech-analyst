"use client";

import { ReactNode } from "react";

interface HeroSectionProps {
  children?: ReactNode;
}

export function HeroSection({ children }: HeroSectionProps) {
  return (
    <section className="text-center px-4 py-20">
      {/* Badge */}
      <div className="mb-8">
        <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#9D97F4]/20 via-[#3D7FFC]/20 to-[#15C1E6]/20 border border-[#3D7FFC]/30 rounded-full text-[#3D7FFC] text-sm font-medium">
          AI-Powered Competitive Intelligence
        </span>
      </div>

      {/* Title */}
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
        Market Intelligence
      </h1>

      {/* Subtitle */}
      <p className="text-white/60 text-center max-w-2xl mx-auto mb-12 text-lg">
        Generate Magic Quadrants, Waves, and Radars for
        any market sector in seconds using AI-powered analysis.
      </p>

      {/* Search area - passed as children */}
      {children}
    </section>
  );
}
