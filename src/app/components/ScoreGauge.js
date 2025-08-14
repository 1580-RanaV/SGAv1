export default function ScoreGauge({ value = 0 }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-neutral-500">Match score</span>
        <span className="text-sm font-semibold tracking-tight">{pct}%</span>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-3 md:h-3.5 rounded-xl bg-neutral-200 overflow-hidden"
        role="progressbar"
        aria-label="Match score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div
          className="h-full bg-green-500 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
