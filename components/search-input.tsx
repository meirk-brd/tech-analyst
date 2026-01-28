"use client";

import { useState, FormEvent } from "react";
import { Search, Loader2 } from "lucide-react";

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function SearchInput({
  onSearch,
  isLoading = false,
  placeholder = "Enter market sector (e.g., Vector Databases, CRM Software)",
}: SearchInputProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
      <div className="flex items-center bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#3D7FFC]/50 focus-within:ring-2 focus-within:ring-[#3D7FFC]/20 transition-all duration-200">
        <Search className="w-5 h-5 text-white/40 mr-3 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none text-base disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="ml-3 px-5 py-2 bg-gradient-to-r from-[#9D97F4] via-[#3D7FFC] to-[#15C1E6] text-white font-medium text-sm rounded-lg hover:shadow-lg hover:shadow-[#3D7FFC]/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze Market"
          )}
        </button>
      </div>
    </form>
  );
}
