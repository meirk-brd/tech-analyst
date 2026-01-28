"use client";

interface ScoreDisplayProps {
  label: string;
  value: number;
  maxValue?: number;
}

export function ScoreDisplay({ label, value, maxValue = 100 }: ScoreDisplayProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  // Color gradient based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "from-green-500 to-green-400";
    if (score >= 60) return "from-[#3D7FFC] to-[#15C1E6]";
    if (score >= 40) return "from-amber-500 to-amber-400";
    return "from-red-500 to-red-400";
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-white/60 text-xs">{label}</span>
        <span className="text-white text-sm font-medium">{value}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${getScoreColor(value)} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
