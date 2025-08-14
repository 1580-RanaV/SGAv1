"use client";
import { useEffect, useState } from 'react';

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
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (percentage) => {
    if (percentage >= 80) return 'Excellent Match';
    if (percentage >= 60) return 'Good Match';
    if (percentage >= 40) return 'Fair Match';
    return 'Needs Improvement';
  };

  const getGradient = (percentage) => {
    if (percentage >= 80) {
      return 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'; // Green
    }
    if (percentage >= 60) {
      return 'linear-gradient(90deg, #eab308 0%, #f59e0b 100%)'; // Yellow
    }
    if (percentage >= 40) {
      return 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)'; // Orange  
    }
    return 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'; // Red
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-gray-600">{label}</h3>
          <p className={`text-xs ${getScoreColor(pct)} font-medium`}>
            {getScoreLabel(pct)}
          </p>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold ${getScoreColor(pct)}`}>
            {pct}%
          </span>
          {details?.method && (
            <p className="text-xs text-gray-400 mt-1">
              via {details.method.replace('_', ' ')}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div
          className="w-full h-4 rounded-full bg-gray-100 border border-gray-200 overflow-hidden"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div
            className="h-full transition-all duration-1000 ease-out rounded-full"
            style={{
              width: `${animatedValue}%`,
              background: getGradient(pct),
              boxShadow: animatedValue > 0 ? 'inset 0 1px 0 rgba(255,255,255,0.3)' : 'none'
            }}
          />
        </div>
        
        {/* Progress markers */}
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Details Section */}
      {details && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {details.explanation && (
            <p className="text-sm text-gray-600 mb-2">{details.explanation}</p>
          )}
          
          {details.matching_skills && details.matching_skills.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium text-gray-500 mb-1">Matching Skills:</p>
              <div className="flex flex-wrap gap-1">
                {details.matching_skills.slice(0, 8).map((skill, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md border border-green-200"
                  >
                    {skill}
                  </span>
                ))}
                {details.matching_skills.length > 8 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                    +{details.matching_skills.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          {details.missing_critical && details.missing_critical.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Missing Critical Skills:</p>
              <div className="flex flex-wrap gap-1">
                {details.missing_critical.slice(0, 6).map((skill, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md border border-red-200"
                  >
                    {skill}
                  </span>
                ))}
                {details.missing_critical.length > 6 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
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