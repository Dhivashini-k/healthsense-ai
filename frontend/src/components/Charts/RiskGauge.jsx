import React from 'react';

export default function RiskGauge({ score }) {
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  
  // Calculate SVG arc parameters
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  // Arc goes from -210 degrees to +30 degrees (240 degrees total out of 360)
  const arcLength = (240 / 360) * circumference;
  const strokeDasharray = `${arcLength} ${circumference}`;
  const strokeDashoffset = arcLength - (normalizedScore / 100) * arcLength;
  
  let color = "#10b981"; // emerald-500
  let label = "Low Risk";
  if (normalizedScore >= 71) {
    color = "#f43f5e"; // rose-500
    label = "High Risk";
  } else if (normalizedScore >= 41) {
    color = "#f59e0b"; // amber-500
    label = "Moderate Risk";
  }

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg className="w-32 h-32 transform -rotate-125" viewBox="0 0 160 160">
        {/* Background Arc */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="transparent"
          stroke="#e2e8f0"
          strokeWidth="12"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className="transform rotate-[150deg] origin-center"
        />
        {/* Value Arc */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transform rotate-[150deg] origin-center transition-all duration-1000 ease-out"
        />
      </svg>
      
      <div className="absolute flex flex-col items-center justify-center text-center mt-2">
        <span className={`text-3xl font-black ${normalizedScore >= 71 ? 'text-brand-high' : normalizedScore >= 41 ? 'text-brand-amber' : 'text-brand-low'}`}>{Math.round(normalizedScore)}%</span>
        <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}
