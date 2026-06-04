'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronRight, Copy, Check, Sparkles, X } from 'lucide-react';
import { useLang } from '@/i18n';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const DISMISS_KEY = (id: string) => `solo_qs_dismissed_${id}`;

interface Props {
  workspaceId: string;
  workspaceName: string;
  onDismiss: () => void;
}

export function SoloQuickStart({ workspaceId, workspaceName, onDismiss }: Props) {
  const { t } = useLang();
  const { setWorkspaceProfile } = useWorkspace();
  const router = useRouter();
  const o = t.smb.solo.onboarding;

  const [step, setStep] = useState(0);
  const [studioName, setStudioName] = useState(workspaceName);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [portalUrl, setPortalUrl] = useState('');

  useEffect(() => {
    if (step === 3 && workspaceId) {
      setPortalUrl(`${window.location.origin}/portal?ws=${workspaceId}`);
    }
  }, [step, workspaceId]);

  async function saveStudioName() {
    if (!studioName.trim()) return;
    setSaving(true);
    try {
      await supabase.from('workspaces').update({ name: studioName.trim() }).eq('id', workspaceId);
      setWorkspaceProfile({ name: studioName.trim() });
      setStep(1);
    } catch {
      toast.error('Could not save studio name.');
    } finally {
      setSaving(false);
    }
  }

  async function saveClient() {
    if (!clientName.trim()) return;
    setSaving(true);
    try {
      await supabase.from('clients').insert({
        workspace_id: workspaceId,
        name: clientName.trim(),
        email: clientEmail.trim() || null,
        status: 'active',
      });
      setStep(2);
    } catch {
      toast.error('Could not add client.');
    } finally {
      setSaving(false);
    }
  }

  function copyPortal() {
    navigator.clipboard.writeText(portalUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDismiss() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISS_KEY(workspaceId), '1');
    }
    onDismiss();
  }

  function finish() {
    handleDismiss();
    router.push('/app/dashboard');
  }

  const STEPS = o.steps;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="relative rounded-xl border border-white/8 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #111522 0%, #0E1320 100%)' }}
    >
      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-lg text-fog hover:text-silver hover:bg-white/5 transition-colors cursor-pointer z-10"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={13} className="text-[#7FA38A]" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#7FA38A]">Solo Studio Setup</span>
        </div>
        <p className="text-sm font-semibold text-ivory">{o.title}</p>
        <p className="text-xs text-silver mt-0.5">{o.subtitle}</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center px-5 pt-4 pb-3 gap-2">
        {STEPS.map((label: string, i: number) => (
          <div key={i} className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors ${
              i < step
                ? 'bg-[#7FA38A] text-obsidian'
                : i === step
                ? 'bg-white/10 text-ivory ring-1 ring-[#7FA38A]'
                : 'bg-white/5 text-fog'
            }`}>
              {i < step ? <Check size={9} /> : i + 1}
            </div>
            <span className={`text-[10px] truncate hidden sm:block ${i === step ? 'text-ivory font-medium' : i < step ? 'text-silver' : 'text-fog'}`}>{label}</span>
            {i < STEPS.length - 1 && <ChevronRight size={9} className="text-white/15 shrink-0 ml-auto" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="px-5 pb-5">
        <AnimatePresence mode="wait">

          {/* Step 0: Studio name */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}>
              <p className="text-[11px] text-silver mb-2">{o.studio.label}</p>
              <input
                className="w-full rounded-lg px-3 py-2 text-xs text-ivory border border-white/8 focus:outline-none focus:border-white/20 mb-3"
                style={{ backgroundColor: '#0A0D14' }}
                value={studioName}
                onChange={e => setStudioName(e.target.value)}
                placeholder={o.studio.placeholder}
                onKeyDown={e => e.key === 'Enter' && saveStudioName()}
              />
              <div className="flex items-center justify-between">
                <button onClick={handleDismiss} className="text-[11px] text-fog hover:text-silver transition-colors cursor-pointer">{o.cta.skip}</button>
                <button
                  onClick={saveStudioName}
                  disabled={!studioName.trim() || saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-obsidian bg-ivory hover:bg-ivory/90 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  {saving ? o.cta.saving : o.cta.next}
                  {!saving && <ChevronRight size={11} />}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Add first client */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}>
              <div className="space-y-2 mb-3">
                <div>
                  <p className="text-[11px] text-silver mb-1">{o.client.nameLabel}</p>
                  <input
                    className="w-full rounded-lg px-3 py-2 text-xs text-ivory border border-white/8 focus:outline-none focus:border-white/20"
                    style={{ backgroundColor: '#0A0D14' }}
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder={o.client.namePlaceholder}
                    onKeyDown={e => e.key === 'Enter' && saveClient()}
                  />
                </div>
                <div>
                  <p className="text-[11px] text-silver mb-1">{o.client.emailLabel}</p>
                  <input
                    type="email"
                    className="w-full rounded-lg px-3 py-2 text-xs text-ivory border border-white/8 focus:outline-none focus:border-white/20"
                    style={{ backgroundColor: '#0A0D14' }}
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    placeholder={o.client.emailPlaceholder}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button onClick={() => setStep(2)} className="text-[11px] text-fog hover:text-silver transition-colors cursor-pointer">{o.cta.skip}</button>
                <button
                  onClick={saveClient}
                  disabled={!clientName.trim() || saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-obsidian bg-ivory hover:bg-ivory/90 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  {saving ? o.cta.saving : o.cta.next}
                  {!saving && <ChevronRight size={11} />}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Draft proposal */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}>
              <div className="rounded-lg border border-white/6 p-3 mb-3" style={{ backgroundColor: '#0A0D14' }}>
                <p className="text-xs font-medium text-ivory mb-1">{o.proposal.label}</p>
                <p className="text-[11px] text-silver leading-relaxed">{o.proposal.hint}</p>
              </div>
              <div className="flex items-center justify-between">
                <button onClick={() => setStep(3)} className="text-[11px] text-fog hover:text-silver transition-colors cursor-pointer">{o.cta.skip}</button>
                <button
                  onClick={() => { router.push('/app/proposals?copilot=1'); handleDismiss(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#7FA38A]/50 text-[#7FA38A] hover:bg-[#7FA38A]/10 transition-colors cursor-pointer"
                >
                  <Sparkles size={11} />
                  {o.proposal.label}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Portal ready */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}>
              <div className="rounded-lg border border-white/6 p-3 mb-3" style={{ backgroundColor: '#0A0D14' }}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={13} className="text-[#7FA38A] shrink-0" />
                  <p className="text-xs font-medium text-ivory">{o.portal.label}</p>
                </div>
                <p className="text-[11px] text-silver leading-relaxed mb-2">{o.portal.hint}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[10px] text-fog truncate bg-white/5 rounded px-2 py-1">{portalUrl || '...'}</code>
                  <button
                    onClick={copyPortal}
                    className="shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[10px] border border-white/10 text-silver hover:text-ivory hover:border-white/20 transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={10} className="text-[#7FA38A]" /> : <Copy size={10} />}
                    {copied ? o.portal.copied : o.portal.copy}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <button
                  onClick={finish}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-obsidian bg-ivory hover:bg-ivory/90 transition-colors cursor-pointer"
                >
                  {o.cta.finish}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function useSoloQuickStart(workspaceId: string | undefined) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    const dismissed = typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY(workspaceId));
    if (!dismissed) setVisible(true);
  }, [workspaceId]);

  return { visible, dismiss: () => setVisible(false) };
}
