'use client';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Sparkles, History, ShieldCheck, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AgentOps() {
  // Get first workspace for now
  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;
  
  const agents = useQuery(api.agents.list, workspaceId ? { workspaceId } : "skip") ?? [];
  const audit = useQuery(api.agents.getAudit, workspaceId ? { workspaceId } : "skip") ?? [];

  return (
    <div className="space-y-8 max-w-6xl">
      <header>
        <h1 className="text-3xl font-bold text-near-black dark:text-parchment font-serif italic flex items-center gap-3">
          <Sparkles className="text-terracotta" />
          Agent Operations
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Monitor the lifecycle, actions, and governance of your AI agency agents.
        </p>
      </header>

      {/* Agents Status Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {agents.map((agent: any, index: number) => (
          <motion.div
            key={agent._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-card antigravity-float border-clay/10">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold">{agent.name}</CardTitle>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    agent.status === 'active' ? "bg-sage animate-pulse" : "bg-muted-foreground"
                  )} />
                </div>
                <p className="text-[10px] text-terracotta font-medium uppercase tracking-widest">{agent.role}</p>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                  {agent.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-1">
                  {agent.tools.map((tool: string) => (
                    <span key={tool} className="text-[9px] px-1.5 py-0.5 rounded bg-clay/10 border border-clay/10 text-near-black/70 dark:text-parchment/70">
                      {tool}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Audit Trail */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass-card border-clay/10">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <History size={16} className="text-terracotta" />
              Live Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {audit.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No recent agent activity.</p>
              ) : (
                audit.map((log: any) => (
                  <div key={log._id} className="flex gap-4 p-3 rounded-lg bg-parchment/30 dark:bg-near-black/20 border border-clay/5">
                    <div className="shrink-0 mt-1">
                      <ShieldCheck size={14} className="text-sage" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-near-black dark:text-parchment">
                        {log.action}
                      </p>
                      <pre className="text-[10px] text-muted-foreground overflow-hidden">
                        {JSON.stringify(log.details)}
                      </pre>
                      <p className="text-[9px] text-clay font-medium">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <div className="space-y-6">
          <Card className="glass-card border-clay/10 antigravity-float">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity size={16} className="text-terracotta" />
                System Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Active Workflows</span>
                  <span className="font-bold">12</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-bold text-sage">99.2%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Human Interventions</span>
                  <span className="font-bold text-terracotta">2</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-clay/10 bg-terracotta/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Governance Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Currently operating in <strong>Suggest-then-Approve</strong> mode. Agents require explicit confirmation for all critical actions.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
