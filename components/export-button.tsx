"use client";

import { Download } from "lucide-react";

interface ExportButtonProps {
  csv: string;
  marketSector: string;
  disabled?: boolean;
}

export function ExportButton({ csv, marketSector, disabled = false }: ExportButtonProps) {
  const handleExport = () => {
    if (!csv) return;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const date = new Date().toISOString().split("T")[0];
    const filename = `tech-analyst-${marketSector.toLowerCase().replace(/\s+/g, "-")}-${date}.csv`;

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || !csv}
      className="flex items-center gap-2 px-4 py-2 border border-white/20 text-white/90 text-sm font-medium rounded-lg hover:bg-white/5 hover:border-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-white/20"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </button>
  );
}
