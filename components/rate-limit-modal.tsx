"use client";

import { X, Sparkles } from "lucide-react";
import { basePath } from "@/lib/base-path";

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RateLimitModal({ isOpen, onClose }: RateLimitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900/95 border border-white/10 rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge */}
        <div className="inline-block px-3 py-1 bg-[#3D7FFC]/10 border border-[#3D7FFC]/30 rounded-full text-[#3D7FFC] text-xs font-medium mb-4">
          Usage Limit Reached
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <img
            src={`${basePath}/bright-data-logo.png`}
            alt="Bright Data"
            className="h-6 w-auto"
          />
          <span className="text-white/60">×</span>
          <img
            src={`${basePath}/mongodb-logo.png`}
            alt="MongoDB"
            className="h-6 w-auto"
          />
        </div>

        {/* Title & Description */}
        <h2 className="text-white text-2xl font-bold mb-2">
          It&apos;s just a demo!
        </h2>
        <p className="text-white/60 text-sm mb-8">
          You have used all 5 free analyses available in this demo.
          <br />
          Clone the repo to run unlimited analyses with your own API keys,
          <br />
          or claim free Bright Data credits to power your agents.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <a
            href="https://github.com/anthropics/claude-code"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-gradient-to-r from-[#9D97F4] via-[#3D7FFC] to-[#15C1E6] text-white font-medium rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#3D7FFC]/30 transition-all duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Clone the Repo
          </a>

          <a
            href="https://brightdata.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-white/5 border border-white/10 text-white font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all duration-200"
          >
            <Sparkles className="w-5 h-5" />
            Claim Free Credits
          </a>
        </div>

        {/* Footer note */}
        <p className="text-white/40 text-xs mt-6">
          Built with Bright Data&apos;s Agentic AI infrastructure
        </p>
      </div>
    </div>
  );
}
