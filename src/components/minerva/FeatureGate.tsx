'use client';
import React, { useState, useEffect } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { getUnlockedFeatures, unlockFeature, UNLOCKABLE_FEATURES } from '@/lib/v1-features';
import { cn } from '@/lib/utils';

interface FeatureGateProps {
  featureId: string;
  children: React.ReactNode;
  className?: string;
  /** Minimum height of the lock overlay (default 240px) */
  minHeight?: number;
}

export function FeatureGate({ featureId, children, className, minHeight = 240 }: FeatureGateProps) {
  // Start as "unlocked" to avoid SSR mismatch / layout flash on first render.
  const [unlocked, setUnlocked] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUnlocked(getUnlockedFeatures().has(featureId));
    setMounted(true);
  }, [featureId]);

  // While hydrating, render children normally to avoid layout shift.
  if (!mounted || unlocked) return <>{children}</>;

  const meta = UNLOCKABLE_FEATURES[featureId];

  return (
    <div
      className={cn('relative rounded-2xl overflow-hidden border border-border', className)}
      style={{ minHeight }}
    >
      {/* Blurred preview background */}
      <div className="absolute inset-0 blur-sm opacity-20 pointer-events-none select-none" aria-hidden>
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-background/85 backdrop-blur-[2px]">
        <div className="h-11 w-11 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-4">
          <Lock size={18} className="text-primary" strokeWidth={1.75} />
        </div>
        <h3 className="text-[15px] font-semibold text-foreground mb-1.5">
          {meta?.title ?? featureId}
        </h3>
        <p className="text-sm text-muted-foreground max-w-[300px] mb-6 leading-relaxed">
          {meta?.description ?? 'Unlock this feature to get started.'}
        </p>
        <button
          onClick={() => {
            unlockFeature(featureId);
            setUnlocked(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
        >
          <Sparkles size={14} strokeWidth={1.75} />
          Unlock feature
        </button>
        <p className="text-[11px] text-muted-foreground mt-3 opacity-60">
          Feature available on your current plan
        </p>
      </div>
    </div>
  );
}
