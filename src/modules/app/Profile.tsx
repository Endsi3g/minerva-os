'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Bot, Mail, Shield, Sparkles, Award, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { TextureOverlay } from '@/components/ui/texture-overlay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const PERFORMANCE_DATA = [
  { month: 'Jan', tasksCompleted: 15, onTimeRate: 90 },
  { month: 'Feb', tasksCompleted: 22, onTimeRate: 95 },
  { month: 'Mar', tasksCompleted: 18, onTimeRate: 93 },
  { month: 'Apr', tasksCompleted: 25, onTimeRate: 98 },
  { month: 'May', tasksCompleted: 30, onTimeRate: 100 },
];

const UTILIZATION_DATA = [
  { name: 'Billable Hours', value: 38, color: 'var(--primary)' },
  { name: 'Non-Billable Hours', value: 12, color: 'var(--warning)' },
];

export default function Profile() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const [bio, setBio] = useState(
    "Managing operations and workspace structure for Uprising Studio. Focused on establishing scalable workflows, safeguarding healthy project margins, and maintaining an elite customer delivery standard."
  );
  const [isEditing, setIsEditing] = useState(false);

  const displayName = user?.name ?? 'Kael';
  const email = user?.email ?? 'kael@uprisingstudio.com';
  const role = user?.role ?? 'Owner / Managing Director';

  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 w-full px-6 py-6 max-w-[1200px] mx-auto select-none">
      
      {/* Banner & Identity */}
      <div className="relative rounded-xl overflow-hidden border border-border bg-surface shadow-lg">
        {/* Video/Gradient Banner */}
        <div className="h-44 w-full bg-gradient-to-r from-secondary via-background to-surface relative">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-35"
            src="/dashboard-banner.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
        </div>

        {/* Profile Details Overlay */}
        <div className="p-6 pt-0 relative -mt-10 flex flex-col sm:flex-row items-center sm:items-end gap-5">
          <div className="h-20 w-20 rounded-full border-4 border-surface bg-primary flex items-center justify-center text-xl font-bold text-obsidian shadow-md shrink-0">
            {initials}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1 pb-1">
            <h1 className="text-xl font-bold text-foreground tracking-tight">{displayName}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield size={12} className="text-primary" />
                {role}
              </span>
              <span className="flex items-center gap-1">
                <Mail size={12} />
                {email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                Joined June 2026
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column (2/3 width) - Charts & Stats */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Bio / Description Card */}
          <Card className="bg-surface border border-border rounded-xl shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-foreground">Focus Description</CardTitle>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-[10px] font-bold text-primary hover:underline transition-all cursor-pointer"
              >
                {isEditing ? 'Save Focus' : 'Edit Focus'}
              </button>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full bg-secondary border border-white/10 rounded-xl p-3 text-xs text-muted-foreground placeholder-fog resize-none outline-none focus:border-white/20 transition-colors"
                />
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">{bio}</p>
              )}
            </CardContent>
          </Card>

          {/* Performance stats charts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Task Completion Rate (AreaChart) */}
            <Card className="bg-surface border border-border rounded-xl shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-primary" />
                  Task Delivery Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PERFORMANCE_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--secondary)', borderColor: 'var(--border)', borderRadius: '8px' }}
                      labelStyle={{ fontSize: '10px', color: 'var(--foreground)', fontWeight: 600 }}
                      itemStyle={{ fontSize: '10px', color: 'var(--muted-foreground)' }}
                    />
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="onTimeRate" stroke="var(--primary)" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRate)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Billable Hour Utilization (PieChart) */}
            <Card className="bg-surface border border-border rounded-xl shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider font-semibold text-foreground flex items-center gap-1.5">
                  <TrendingUp size={13} className="text-warning" />
                  Hour Utilization
                </CardTitle>
              </CardHeader>
              <CardContent className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={UTILIZATION_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={55}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {UTILIZATION_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--secondary)', borderColor: 'var(--border)', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '9px', color: 'var(--muted-foreground)' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconSize={8}
                      formatter={(value) => <span className="text-[9px] text-muted-foreground">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </div>

        </div>

        {/* Right Column (1/3 width) - AI Advice */}
        <div className="space-y-6">
          
          {/* AI Advisor Panel */}
          <Card className="bg-surface border border-border rounded-xl shadow-none relative overflow-hidden">
            <TextureOverlay texture="dots" opacity={0.08} />
            <CardHeader className="relative z-10 flex flex-row items-center gap-2 pb-2">
              <Sparkles size={14} className="text-warning animate-pulse" />
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-foreground">Hermes Advisor</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <div className="flex items-start gap-3 p-3 bg-white/2 border border-border rounded-xl">
                <Bot size={14} className="text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-foreground">Delivery Performance</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Your task on-time delivery is at <span className="text-primary font-semibold">98%</span>. Continue prioritizing tasks under active projects to secure a perfect score this cycle.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/2 border border-border rounded-xl">
                <TrendingUp size={14} className="text-warning shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-foreground">Utilization Optimization</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Unbilled support time currently uses <span className="text-warning font-semibold">24%</span> of your weekly capacity. I recommend setting up workflow automation triggers to reduce manual triage.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/2 border border-border rounded-xl">
                <Award size={14} className="text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-foreground">Operational Excellence</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    You have successfully guided the onboarding of all workspaces. Consider upgrading the setup kit templates to further accelerate future client integrations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Roles & Permissions Info */}
          <Card className="bg-surface border border-border rounded-xl shadow-none">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-foreground">System Permission Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                <span className="text-muted-foreground">Active Workspace</span>
                <span className="text-foreground font-medium">{workspace?.name ?? 'AS Mobbin'}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                <span className="text-muted-foreground">Workspace Tier</span>
                <span className="text-foreground font-semibold capitalize">{workspace?.tier ?? 'starter'}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-muted-foreground">Role Scope</span>
                <span className="text-foreground font-medium capitalize">{user?.role ?? 'Owner'}</span>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
