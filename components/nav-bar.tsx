"use client";

import { basePath } from "@/lib/base-path";

interface NavBarProps {
  onPreviousSearchesClick?: () => void;
}

export function NavBar({ onPreviousSearchesClick }: NavBarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#091B36]/90 backdrop-blur-md border-b border-[#29436E]/50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between lg:px-8">
        {/* Logo */}
        <a
          href="https://docs.brightdata.com/introduction"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity shrink-0"
        >
          <img
            src={`${basePath}/bright-data-logo.png`}
            alt="Bright Data"
            className="h-5 sm:h-8"
          />
          <span className="text-xs sm:text-base">🤝</span>
          <img
            src={`${basePath}/mongodb-logo.png`}
            alt="MongoDB"
            className="h-5 sm:h-8"
          />
        </a>

        {/* Nav links */}
        <div className="flex items-center gap-2 sm:gap-4">
          <a href={basePath || "/"} className="text-white/70 hover:text-white text-xs sm:text-sm transition-colors">
            Home
          </a>
          <button
            onClick={onPreviousSearchesClick}
            className="px-2 sm:px-4 py-1 sm:py-1.5 bg-[#3D7FFC]/10 border border-[#3D7FFC]/30 text-[#3D7FFC] text-xs sm:text-sm font-medium rounded-lg hover:bg-[#3D7FFC]/20 transition-colors whitespace-nowrap"
          >
            Previous Searches
          </button>
        </div>
      </div>
    </nav>
  );
}
