import * as React from 'react';
import { cn } from '@/lib/utils';

export interface GradientSpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: 'violet' | 'magenta' | 'orange' | 'coral';
  children?: React.ReactNode;
}

export function GradientSpotlightCard({
  className,
  gradient = 'violet',
  children,
  ...props
}: GradientSpotlightCardProps) {
  const glows = {
    violet: 'bg-[#6a4cf5]/12',
    magenta: 'bg-[#d44df0]/12',
    orange: 'bg-[#ff7a3d]/12',
    coral: 'bg-[#ff5577]/12',
  };

  const borderGlows = {
    violet: 'group-hover:border-[#6a4cf5]/30',
    magenta: 'group-hover:border-[#d44df0]/30',
    orange: 'group-hover:border-[#ff7a3d]/30',
    coral: 'group-hover:border-[#ff5577]/30',
  };

  return (
    <div
      className={cn(
        "relative rounded-[20px] p-6 bg-[#141414] border border-white/5 overflow-hidden group shadow-card transition-all duration-500 hover:scale-[1.01] select-none",
        borderGlows[gradient],
        className
      )}
      {...props}
    >
      {/* Background spotlight radial blur wash */}
      <div className={cn("absolute -top-32 -left-32 w-80 h-80 rounded-full blur-[80px] pointer-events-none transition-all duration-700 opacity-60 group-hover:opacity-85 group-hover:scale-110", glows[gradient])} />
      
      {/* Secondary spotlight for subtle right side ambient color */}
      <div className={cn("absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[110px] pointer-events-none transition-all duration-700 opacity-20 group-hover:opacity-35", glows[gradient])} />

      {/* Subtle top highlights */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col h-full justify-between">
        {children}
      </div>
    </div>
  );
}
