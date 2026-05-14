'use client';

interface GaugeProps {
  value: number;
  color?: string;
  showLabels?: boolean;
  min?: string;
  max?: string;
}

export default function Gauge({ 
  value, 
  color = "#ef4d23", 
  showLabels, 
  min, 
  max 
}: GaugeProps) {
  const totalTicks = 40;
  const activeTicks = Math.round((value / 100) * totalTicks);
  
  return (
    <div className="flex flex-col items-center w-full max-w-[260px]">
      <svg viewBox="0 0 200 120" className="w-full h-auto">
        {/* Arc of ticks */}
        {Array.from({ length: totalTicks }).map((_, i) => {
          const angle = Math.PI + (i / (totalTicks - 1)) * Math.PI;
          const r = 80;
          const rInner = r - 10;
          const x1 = 100 + rInner * Math.cos(angle);
          const y1 = 100 + rInner * Math.sin(angle);
          const x2 = 100 + r * Math.cos(angle);
          const y2 = 100 + r * Math.sin(angle);
          
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={i < activeTicks ? color : "#d4d4d8"}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          );
        })}
        
        {/* Center text */}
        <text 
          x="100" 
          y="105" 
          textAnchor="middle" 
          className="text-[22px] font-semibold"
          fill="currentColor"
        >
          {value}%
        </text>
      </svg>
      
      {showLabels && (
        <div className="flex justify-between w-full mt-1 px-1 text-[11px] text-neutral-500 font-medium">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}
