'use client';
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { FileSignature, Check, ChevronDown, ChevronUp, MessageSquare, X } from 'lucide-react';
import { usePortalData } from './usePortalData';
import { useLang } from '@/i18n';
import { CommentSection } from '@/components/minerva/CommentSection';
import { toast } from 'sonner';

const fadeInUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: i * 0.07 } }),
};

function fmt(amount: number, lang: 'en' | 'fr' = 'en') {
  return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

interface SignatureModalProps {
  proposal: any;
  onConfirm: (signerName: string) => Promise<void>;
  onCancel: () => void;
  labels: any;
  signing: boolean;
  lang: 'en' | 'fr';
}

function SignatureModal({ proposal, onConfirm, onCancel, labels, signing, lang }: SignatureModalProps) {
  const m = labels.signatureModal;
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);

  async function handleSign() {
    if (!name.trim() || !agreed || signing) return;
    await onConfirm(name.trim());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-card overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(5,150,105,0.10)' }}>
              <FileSignature size={14} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{m.title}</p>
              <p className="text-[11px] mt-0.5 text-muted-foreground">{proposal.title}</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Proposal amount */}
          {proposal.total_amount > 0 && (
            <div className="flex items-center justify-between rounded-xl px-4 py-3 border border-border bg-background">
              <span className="text-xs text-muted-foreground">{m.totalInvestment}</span>
              <span className="text-sm font-semibold text-foreground">{fmt(proposal.total_amount, lang)}</span>
            </div>
          )}

          {/* Description */}
          <p className="text-xs leading-relaxed text-muted-foreground">{m.desc}</p>

          {/* Name input */}
          <div>
            <label className="block text-[11px] font-medium mb-1.5 text-muted-foreground">{m.nameLabel}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={m.namePlaceholder}
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-background border border-border text-foreground placeholder:text-muted-foreground"
              onKeyDown={e => e.key === 'Enter' && handleSign()}
            />
          </div>

          {/* Styled signature preview */}
          {name.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl px-4 py-3 border text-center border-emerald-200 dark:border-emerald-800 bg-background"
            >
              <p
                className="text-xl text-emerald-600"
                style={{ fontFamily: '"Playfair Display", Georgia, serif', fontStyle: 'italic', letterSpacing: '0.02em' }}
              >
                {name}
              </p>
              <p className="text-[10px] mt-1 text-muted-foreground">
                {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </motion.div>
          )}

          {/* Agree checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded shrink-0 cursor-pointer accent-emerald-600"
            />
            <span className="text-xs leading-relaxed text-muted-foreground">{m.agreeLabel}</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-muted-foreground border border-border hover:bg-accent"
          >
            {m.cancel}
          </button>
          <button
            onClick={handleSign}
            disabled={!name.trim() || !agreed || signing}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {signing ? '...' : m.sign}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function PortalProposals() {
  const { t, lang } = useLang();
  const pp = t.portal.proposals;
  const { isValid, proposals, token } = usePortalData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [modalProposal, setModalProposal] = useState<any>(null);

  if (!isValid) return null;

  const justSigned = searchParams.get('signed') === '1';

  async function handleSign(proposalId: string, signerName: string) {
    if (!token || signingId) return;
    setSigningId(proposalId);
    try {
      const res = await fetch('/api/portal/proposal/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, proposalId, action: 'sign', signerName }),
      });
      if (res.ok) {
        setModalProposal(null);
        router.push(`/portal/${token}/proposals?signed=1`);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? pp.signError);
        setSigningId(null);
      }
    } catch (err) {
      console.error(err);
      toast.error(pp.signError);
      setSigningId(null);
    }
  }

  if (!proposals || proposals.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-normal text-foreground" style={{ fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' }}>
            {pp.title}
          </h1>
          <p className="text-sm mt-1 text-muted-foreground">{pp.subtitle}</p>
        </div>
        <div className="rounded-[16px] border border-border bg-card p-12 text-center">
          <FileSignature size={24} className="mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">{pp.empty}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {modalProposal && (
          <SignatureModal
            proposal={modalProposal}
            onConfirm={name => handleSign(modalProposal.id, name)}
            onCancel={() => setModalProposal(null)}
            labels={pp}
            signing={signingId === modalProposal.id}
            lang={lang}
          />
        )}
      </AnimatePresence>

      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-normal text-foreground" style={{ fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' }}>
            {pp.title}
          </h1>
          <p className="text-sm mt-1 text-muted-foreground">{pp.subtitle}</p>
        </div>

        {justSigned && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-xl px-4 py-3 border border-emerald-200 dark:border-emerald-800"
            style={{ backgroundColor: 'rgba(5,150,105,0.06)' }}
          >
            <Check size={15} className="text-emerald-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-600">{pp.confirmTitle}</p>
              <p className="text-xs mt-0.5 text-muted-foreground">{pp.confirmMessage}</p>
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          {proposals.map((proposal: any, i: number) => {
            const status = proposal.status as 'sent' | 'signed' | 'declined';
            const statusConfig = {
              sent:     { label: pp.status.sent,     colorClass: 'text-amber-600',          bgStyle: 'rgba(184,155,106,0.08)', borderStyle: 'rgba(184,155,106,0.22)' },
              signed:   { label: pp.status.signed,   colorClass: 'text-emerald-600',        bgStyle: 'rgba(5,150,105,0.08)',   borderStyle: 'rgba(5,150,105,0.22)'   },
              declined: { label: pp.status.declined, colorClass: 'text-red-500',            bgStyle: 'rgba(239,68,68,0.08)',   borderStyle: 'rgba(239,68,68,0.22)'   },
            }[status] || { label: status, colorClass: 'text-muted-foreground', bgStyle: 'rgba(0,0,0,0.04)', borderStyle: 'rgba(0,0,0,0.12)' };

            const isExpanded = expandedId === proposal.id;

            return (
              <motion.div
                key={proposal.id}
                custom={i}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="rounded-[14px] border border-border bg-card overflow-hidden"
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-muted">
                    <FileSignature size={15} className="text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{proposal.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusConfig.colorClass}`}
                        style={{ backgroundColor: statusConfig.bgStyle, borderColor: statusConfig.borderStyle }}
                      >
                        {statusConfig.label}
                      </span>
                      {proposal.total_amount && (
                        <span className="text-[11px] text-muted-foreground">
                          {fmt(proposal.total_amount, lang)}
                        </span>
                      )}
                      {proposal.valid_until && status === 'sent' && (
                        <span className="text-[11px] text-muted-foreground">
                          {pp.validUntil} {new Date(proposal.valid_until).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {proposal.signed_by && (
                        <span className="text-[11px] text-emerald-600">
                          <Check size={10} className="inline mr-0.5" />
                          {pp.signedBy} {proposal.signed_by}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {status === 'sent' && (
                      <button
                        onClick={() => setModalProposal(proposal)}
                        disabled={signingId !== null}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer text-emerald-600 border border-emerald-200 dark:border-emerald-800"
                        style={{ backgroundColor: 'rgba(5,150,105,0.08)' }}
                      >
                        <FileSignature size={12} />
                        {pp.signCta}
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : proposal.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer text-muted-foreground border border-border hover:bg-accent"
                    >
                      <MessageSquare size={11} />
                      {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 260, opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden border-t border-border"
                    >
                      <div className="p-5 h-full">
                        <CommentSection targetId={proposal.id} targetType="proposal" token={token} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
}
