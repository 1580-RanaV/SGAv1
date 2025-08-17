"use client";
import { useEffect, useState } from "react";

export default function ScoreGauge({ value = 0, label = "Match Score", details = null }) {
  const [animatedValue, setAnimatedValue] = useState(0);

  // Coerce and clamp the value
  const n = Number.isFinite(Number(value)) ? Number(value) : 0;
  const pct = Math.max(0, Math.min(100, Math.round(n)));

  // Animate the progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(pct);
    }, 100);
    return () => clearTimeout(timer);
  }, [pct]);

  // Color coding based on percentage
  const getScoreColor = (percentage) => {
    if (percentage >= 80) return "text-green-400";
    if (percentage >= 60) return "text-yellow-400";
    if (percentage >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreLabel = (percentage) => {
    if (percentage >= 80) return "Excellent Match";
    if (percentage >= 60) return "Good Match";
    if (percentage >= 40) return "Fair Match";
    return "Needs Improvement";
  };

  const getGradient = (percentage) => {
    if (percentage >= 80) return "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)"; // Green
    if (percentage >= 60) return "linear-gradient(90deg, #eab308 0%, #f59e0b 100%)"; // Yellow
    if (percentage >= 40) return "linear-gradient(90deg, #f97316 0%, #ea580c 100%)"; // Orange
    return "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)"; // Red
  };

  return (
    <div className="bg-black rounded-2xl p-6 shadow-sm border border-neutral-700 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs sm:text-lg font-medium text-neutral-400">{label}</h3>
          <p className={`text-xs sm:text-lg font-medium ${getScoreColor(pct)}`}>
            {getScoreLabel(pct)}
          </p>
        </div>
        <div className="text-right">
          <span className={`text-xl sm:text-3xl font-bold ${getScoreColor(pct)}`}>
            {pct}%
          </span>
          {details?.method && (
            <p className="text-xs sm:text-lg text-neutral-500 mt-1">
              via {details.method.replace("_", " ")}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div
          className="w-full h-4 rounded-2xl bg-neutral-800 border border-neutral-700 overflow-hidden"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div
            className="h-full transition-all duration-1000 ease-out rounded-2xl"
            style={{
              width: `${animatedValue}%`,
              background: getGradient(pct),
              boxShadow: animatedValue > 0 ? "inset 0 1px 0 rgba(255,255,255,0.2)" : "none",
            }}
          />
        </div>

        {/* Progress markers */}
        <div className="flex justify-between mt-1 text-xs sm:text-lg text-neutral-500">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Details Section */}
      {details && (
        <div className="mt-4 pt-4 border-t border-neutral-700">
          {details.explanation && (
            <p className="text-xs sm:text-lg text-neutral-300 mb-2">
              {details.explanation}
            </p>
          )}

          {details.matching_skills && details.matching_skills.length > 0 && (
            <div className="mb-2">
              <p className="text-xs sm:text-lg font-medium text-neutral-400 mb-1">
                Matching Skills:
              </p>
              <div className="flex flex-wrap gap-1">
                {details.matching_skills.slice(0, 8).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-green-900 text-green-300 text-xs sm:text-lg rounded-2xl border border-green-700"
                  >
                    {skill}
                  </span>
                ))}
                {details.matching_skills.length > 8 && (
                  <span className="px-2 py-1 bg-neutral-800 text-neutral-400 text-xs sm:text-lg rounded-2xl">
                    +{details.matching_skills.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}

          {details.missing_critical && details.missing_critical.length > 0 && (
            <div>
              <p className="text-xs sm:text-lg font-medium text-neutral-400 mb-1">
                Missing Critical Skills:
              </p>
              <div className="flex flex-wrap gap-1">
                {details.missing_critical.slice(0, 6).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-red-900 text-red-300 text-xs sm:text-lg rounded-2xl border border-red-700"
                  >
                    {skill}
                  </span>
                ))}
                {details.missing_critical.length > 6 && (
                  <span className="px-2 py-1 bg-neutral-800 text-neutral-400 text-xs sm:text-lg rounded-2xl">
                    +{details.missing_critical.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
