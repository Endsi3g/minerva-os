'use client';
import React from 'react';
import { cn } from '@/lib/utils';

interface HealthScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
  label?: string;
}

function scoreColor(score: number): string {
  if (score >= 75) return '#7FA38A';
  if (score >= 50) return '#B89B6A';
  return '#A86A6A';
}

export function HealthScoreRing({
  score,
  size = 56,
  strokeWidth = 5,
  showLabel = true,
  className,
  label,
}: HealthScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.max(0, Math.min(100, score));
  const dash = (filled / 100) * circumference;
  const color = scoreColor(score);
  const cx = size / 2;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={cx}
          cy={cx}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={cx}
          cy={cx}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.23,1,0.32,1)' }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-semibold leading-none" style={{ fontSize: size * 0.23, color }}>
            {score}
          </span>
          {label && (
            <span className="leading-none mt-0.5 text-center" style={{ fontSize: size * 0.14, color: '#8A9099' }}>
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
