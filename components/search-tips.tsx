"use client";

interface SearchTipsProps {
  examples?: string[];
  onExampleClick?: (example: string) => void;
}

const DEFAULT_EXAMPLES = [
  "Vector Databases",
  "CRM Software",
  "API Gateways",
  "Data Warehouses",
];

export function SearchTips({
  examples = DEFAULT_EXAMPLES,
  onExampleClick,
}: SearchTipsProps) {
  return (
    <div className="mt-6 text-sm text-white/50">
      <p className="font-medium text-white/70 mb-2 uppercase tracking-wider text-xs">
        Try These Examples
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {examples.map((example) => (
          <button
            key={example}
            onClick={() => onExampleClick?.(example)}
            className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/70 text-sm hover:bg-white/10 hover:text-white hover:border-white/20 transition-colors"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
