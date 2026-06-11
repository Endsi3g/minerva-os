'use client';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useLang } from '@/i18n';
import { HealthScoreRing } from '@/components/minerva/HealthScoreRing';
import type { TeamScorecard } from '@/lib/types';

const MOCK_SCORECARD: TeamScorecard = {
  period: 'This month',
  teamDeliveryScore: 78,
  avgCapacityPct: 72,
  members: [
    { userId: 'u1', name: 'Alice Martin', role: 'Project Manager', deliveryScore: 88, capacityPct: 85, taskCompletionRate: 92, onTimeRate: 87, openTasks: 6, overdueCount: 1 },
    { userId: 'u2', name: 'Tom Chen', role: 'Designer', deliveryScore: 82, capacityPct: 78, taskCompletionRate: 88, onTimeRate: 83, openTasks: 8, overdueCount: 2 },
    { userId: 'u3', name: 'Sara Dupont', role: 'Developer', deliveryScore: 75, capacityPct: 70, taskCompletionRate: 80, onTimeRate: 74, openTasks: 12, overdueCount: 4 },
    { userId: 'u4', name: 'James Osei', role: 'Strategist', deliveryScore: 91, capacityPct: 65, taskCompletionRate: 95, onTimeRate: 90, openTasks: 4, overdueCount: 0 },
    { userId: 'u5', name: 'Marie Blanc', role: 'Designer', deliveryScore: 68, capacityPct: 74, taskCompletionRate: 75, onTimeRate: 65, openTasks: 10, overdueCount: 5 },
  ],
};

function scoreColor(s: number) {
  return s >= 75 ? 'var(--primary)' : s >= 50 ? 'var(--warning)' : 'var(--destructive)';
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

type Period = 'week' | 'month' | 'quarter';

export default function Scorecards() {
  const { t } = useLang();
  const sc = t.app.scorecards;
  const [period, setPeriod] = useState<Period>('month');
  const data = MOCK_SCORECARD;

  const periods: Period[] = ['week', 'month', 'quarter'];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-normal"
            style={{ fontFamily: '"Playfair Display", Georgia, serif', color: 'var(--foreground)', letterSpacing: '-0.02em' }}
          >
            {sc.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{sc.subtitle}</p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {periods.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
              style={{
                backgroundColor: period === p ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: period === p ? 'var(--foreground)' : 'var(--muted-foreground)',
              }}
            >
              {sc.periods[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Team KPI strip */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-[14px] border p-5 flex items-center gap-5"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <HealthScoreRing score={data.teamDeliveryScore} size={64} />
          <div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{sc.teamScore}</p>
            <p className="text-2xl font-semibold mt-0.5" style={{ color: scoreColor(data.teamDeliveryScore) }}>
              {data.teamDeliveryScore}
              <span className="text-sm font-normal ml-0.5" style={{ color: 'var(--muted-foreground)' }}>/100</span>
            </p>
          </div>
        </div>

        <div
          className="rounded-[14px] border p-5"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>{sc.avgCapacity}</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${data.avgCapacityPct}%`, backgroundColor: scoreColor(data.avgCapacityPct) }}
              />
            </div>
            <span className="text-sm font-semibold shrink-0" style={{ color: scoreColor(data.avgCapacityPct) }}>
              {data.avgCapacityPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Scorecards table */}
      <div
        className="rounded-[16px] border overflow-hidden"
        style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        {/* Table header */}
        <div
          className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_0.5fr_0.5fr] gap-4 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--muted-foreground)' }}
        >
          <span>{sc.columns.member}</span>
          <span>{sc.columns.delivery}</span>
          <span>{sc.columns.capacity}</span>
          <span>{sc.columns.completion}</span>
          <span>{sc.columns.onTime}</span>
          <span>{sc.columns.open}</span>
          <span>{sc.columns.overdue}</span>
        </div>

        {data.members.map((member, i) => (
          <motion.div
            key={member.userId}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_0.5fr_0.5fr] gap-4 items-center px-5 py-3.5"
            style={{ borderBottom: i < data.members.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
          >
            {/* Member */}
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                style={{ backgroundColor: `${scoreColor(member.deliveryScore)}20`, color: scoreColor(member.deliveryScore) }}
              >
                {initials(member.name)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>{member.name}</p>
                <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{member.role}</p>
              </div>
            </div>

            {/* Delivery score bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${member.deliveryScore}%`, backgroundColor: scoreColor(member.deliveryScore) }}
                />
              </div>
              <span className="text-[11px] font-medium shrink-0 w-7 text-right" style={{ color: scoreColor(member.deliveryScore) }}>
                {member.deliveryScore}
              </span>
            </div>

            {/* Capacity bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${member.capacityPct}%`, backgroundColor: '#7FA38A' }}
                />
              </div>
              <span className="text-[11px] shrink-0 w-7 text-right" style={{ color: 'var(--muted-foreground)' }}>
                {member.capacityPct}%
              </span>
            </div>

            {/* Completion */}
            <span className="text-xs" style={{ color: member.taskCompletionRate >= 80 ? '#7FA38A' : 'var(--warning)' }}>
              {member.taskCompletionRate}%
            </span>

            {/* On-time */}
            <span className="text-xs" style={{ color: member.onTimeRate >= 80 ? '#7FA38A' : member.onTimeRate >= 60 ? 'var(--warning)' : 'var(--destructive)' }}>
              {member.onTimeRate}%
            </span>

            {/* Open */}
            <span className="text-xs" style={{ color: 'var(--foreground)' }}>{member.openTasks}</span>

            {/* Overdue */}
            <span className="text-xs font-medium" style={{ color: member.overdueCount > 0 ? 'var(--destructive)' : 'var(--muted-foreground)' }}>
              {member.overdueCount}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
