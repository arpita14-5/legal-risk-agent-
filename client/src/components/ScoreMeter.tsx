import React from 'react';
import type { RiskLevel } from '../types/index.js';

interface ScoreMeterProps {
  score: number;
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreMeter: React.FC<ScoreMeterProps> = ({ score, level, size = 'md' }) => {
  const getColor = (s: number) => {
    if (s >= 76) return { bar: 'bg-rose-500', text: 'text-rose-400', ring: 'stroke-rose-500' };
    if (s >= 51) return { bar: 'bg-orange-500', text: 'text-orange-400', ring: 'stroke-orange-500' };
    if (s >= 26) return { bar: 'bg-amber-500', text: 'text-amber-400', ring: 'stroke-amber-500' };
    return { bar: 'bg-emerald-500', text: 'text-emerald-400', ring: 'stroke-emerald-500' };
  };

  const colors = getColor(score);

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full ${colors.bar}`} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
        </div>
        <span className={`text-xs font-mono font-bold ${colors.text}`}>{score}</span>
      </div>
    );
  }

  // Circular gauge for detailed view
  const radius = size === 'lg' ? 44 : 32;
  const stroke = size === 'lg' ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const boxSize = (radius + stroke) * 2;

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg width={boxSize} height={boxSize} className="transform -rotate-90">
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="transparent"
          className="text-slate-800"
        />
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${colors.ring} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className={`font-mono font-extrabold ${size === 'lg' ? 'text-2xl' : 'text-lg'} ${colors.text}`}>
          {score}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
          / 100
        </span>
      </div>
    </div>
  );
};