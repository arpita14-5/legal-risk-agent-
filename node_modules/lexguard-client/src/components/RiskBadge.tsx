import React from 'react';
import { AlertOctagon, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { RiskLevel } from '../types/index.js';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, size = 'md', showIcon = true }) => {
  const configs = {
    Critical: {
      bg: 'bg-rose-950/70 border-rose-600/60 text-rose-300',
      icon: AlertOctagon,
      iconColor: 'text-rose-400'
    },
    High: {
      bg: 'bg-orange-950/70 border-orange-600/60 text-orange-300',
      icon: AlertTriangle,
      iconColor: 'text-orange-400'
    },
    Moderate: {
      bg: 'bg-amber-950/70 border-amber-600/60 text-amber-300',
      icon: AlertCircle,
      iconColor: 'text-amber-400'
    },
    Low: {
      bg: 'bg-emerald-950/70 border-emerald-600/60 text-emerald-300',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400'
    }
  };

  const current = configs[level] || configs.Moderate;
  const Icon = current.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold'
  };

  return (
    <span className={`inline-flex items-center rounded-full border ${current.bg} ${sizeClasses[size]}`}>
      {showIcon && <Icon className={`w-3.5 h-3.5 ${current.iconColor}`} />}
      <span>{level}</span>
      {score !== undefined && <span className="opacity-80 font-mono">({score})</span>}
    </span>
  );
};