'use client';
import React from 'react';
import { cn } from '@/lib/utils';

interface AgentOrbitProps {
  avatarColor?: string;
  name?: string;
  icons?: any[];
}

export function AgentOrbit({ avatarColor = 'bg-blue-500', name = 'A', icons = [] }: AgentOrbitProps) {
  return (
    <div className="relative w-28 h-28 flex items-center justify-center select-none mx-auto mb-4">
      {/* Outer orbit circle */}
      <div className="absolute w-24 h-24 rounded-full border border-border animate-[spin_40s_linear_infinite]" />
      
      {/* Inner dashed orbit circle */}
      <div className="absolute w-16 h-16 rounded-full border border-dashed border-emerald-600/10 animate-[spin_20s_linear_infinite]" />

      {/* Floating mini icons on outer orbit */}
      {icons.map((Icon: any, idx: number) => {
        const angle = (idx * 360) / icons.length;
        const radius = 48;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;
        
        return (
          <div
            key={idx}
            className="absolute h-5 w-5 rounded-full bg-secondary border border-border flex items-center justify-center shadow-md"
            style={{
              transform: `translate(${x}px, ${y}px)`,
            }}
          >
            <Icon size={10} className="text-emerald-600" />
          </div>
        );
      })}

      {/* Central avatar bubble */}
      <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-foreground shadow-md z-10 border border-border", avatarColor)}>
        {name}
      </div>
    </div>
  );
}
