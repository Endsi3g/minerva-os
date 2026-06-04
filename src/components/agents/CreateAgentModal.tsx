'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Key, Lock } from 'lucide-react';
import { useTier } from '@/lib/hooks/useTier';
import { useAgents } from '@/lib/hooks/useAgents';
import { toast } from 'sonner';

interface CreateAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAgentModal({ open, onOpenChange }: CreateAgentModalProps) {
  const router = useRouter();
  const { createAgent } = useAgents();
  const { tier } = useTier();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [instructions, setInstructions] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStarter = tier === 'starter';

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    const toastId = toast.loading('Deploying agent...');
    try {
      const keysPayload: Record<string, string> = {};
      if (!isStarter) {
        if (openaiKey.trim()) keysPayload.openai = openaiKey.trim();
        if (anthropicKey.trim()) keysPayload.anthropic = anthropicKey.trim();
      }

      await createAgent({
        name,
        role,
        description,
        goal,
        instructions,
        rules: [
          'Always respond using markdown formatting.',
          'Focus on clarity and actionability.'
        ],
        tools: ['Summarize Meeting Transcript']
      }, keysPayload);

      toast.success('Agent deployed successfully!', { id: toastId });
      // Reset
      setName('');
      setRole('');
      setDescription('');
      setGoal('');
      setInstructions('');
      setOpenaiKey('');
      setAnthropicKey('');
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to deploy agent.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-midnight border-white/10 text-ivory selection:bg-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-base font-serif italic text-ivory flex items-center gap-2">
            <Sparkles className="text-warm" size={16} />
            Deploy Custom AI Agent
          </DialogTitle>
          <DialogDescription className="text-xs text-silver">
            Describe your agent's goal and role in your agency workflow. Custom keys are restricted by plan tier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Agent Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. SEO Audit Agent"
                className="bg-black/30 border-white/5 text-xs text-ivory placeholder-fog rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Role Scope</label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. SEO Specialist"
                className="bg-black/30 border-white/5 text-xs text-ivory placeholder-fog rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly state what this agent displays or screens..."
              className="bg-black/30 border-white/5 text-xs text-ivory placeholder-fog rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-silver uppercase tracking-wider">Agent Goal</label>
            <Textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What objective is this agent executing?"
              rows={2}
              className="bg-black/30 border-white/5 text-xs text-silver placeholder-fog rounded-lg resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-silver uppercase tracking-wider">System Instructions</label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Write clear, descriptive workflow guidelines..."
              rows={3}
              className="bg-black/30 border-white/5 text-xs text-silver placeholder-fog rounded-lg resize-none"
            />
          </div>

          {/* Custom API Keys Block */}
          <div className="border border-white/5 rounded-xl p-4 bg-white/[0.01] space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-ivory uppercase tracking-wider flex items-center gap-1">
                <Key size={11} className="text-[#B89B6A]" />
                Custom Provider Keys
              </span>
              {isStarter && (
                <span className="text-[9px] font-bold text-warm bg-warm/10 border border-warm/20 px-2 py-0.5 rounded-full flex items-center gap-1 uppercase">
                  <Lock size={9} /> Starter Lock
                </span>
              )}
            </div>

            {isStarter ? (
              <div className="text-center py-2 space-y-1.5 relative z-10">
                <p className="text-[10px] text-silver leading-relaxed max-w-sm mx-auto">
                  Custom API keys allow your agents to run directly on your own OpenAI / Anthropic accounts. Upgrade to <span className="text-[#7FA38A] font-bold">Growth</span> or <span className="text-[#B89B6A] font-bold">Scale</span> plan to unlock.
                </p>
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    router.push('/app/billing');
                  }}
                  className="bg-warm text-midnight hover:bg-warm/90 rounded-lg text-[9px] font-bold h-6 px-3 cursor-pointer mt-1"
                >
                  Upgrade Plan
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-fog uppercase">OpenAI API Key</label>
                  <Input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                    className="bg-black/30 border-white/5 text-xs text-ivory placeholder-fog rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-fog uppercase">Anthropic API Key</label>
                  <Input
                    type="password"
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="bg-black/30 border-white/5 text-xs text-ivory placeholder-fog rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs text-silver hover:bg-white/5 rounded-lg cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={isSubmitting || !name.trim()}
              className="bg-ivory text-midnight hover:bg-ivory/90 rounded-lg text-xs font-bold px-4 cursor-pointer"
            >
              {isSubmitting ? 'Deploying...' : 'Deploy Agent'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
