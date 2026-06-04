'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileSignature, Check, ChevronDown, ChevronUp, MessageSquare, X } from 'lucide-react';
import { usePortalData } from './usePortalData';
import { useLang } from '@/i18n';
import { CommentSection } from '@/components/minerva/CommentSection';

const fadeInUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: i * 0.07 } }),
};

function fmt(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

interface SignatureModalProps {
  proposal: any;
  onConfirm: (signerName: string) => Promise<void>;
  onCancel: () => void;
  labels: any;
  signing: boolean;
}

function SignatureModal({ proposal, onConfirm, onCancel, labels, signing }: SignatureModalProps) {
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
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border overflow-hidden"
        style={{ backgroundColor: '#111522', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(127,163,138,0.12)' }}>
              <FileSignature size={14} style={{ color: '#7FA38A' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F5F1E8' }}>{m.title}</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#8A9099' }}>{proposal.title}</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1 rounded-lg cursor-pointer" style={{ color: '#8A9099' }}>
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Proposal amount */}
          {proposal.total_amount > 0 && (
            <div className="flex items-center justify-between rounded-xl px-4 py-3 border" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-xs" style={{ color: '#8A9099' }}>Total investment</span>
              <span className="text-sm font-semibold" style={{ color: '#F5F1E8' }}>{fmt(proposal.total_amount)}</span>
            </div>
          )}

          {/* Description */}
          <p className="text-xs leading-relaxed" style={{ color: '#8A9099' }}>{m.desc}</p>

          {/* Name input */}
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#B8BDC7' }}>{m.nameLabel}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={m.namePlaceholder}
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1"
              style={{ backgroundColor: '#0A0D14', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F1E8', focusRingColor: 'rgba(127,163,138,0.4)' }}
              onKeyDown={e => e.key === 'Enter' && handleSign()}
            />
          </div>

          {/* Styled signature preview */}
          {name.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl px-4 py-3 border text-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(127,163,138,0.2)' }}
            >
              <p
                className="text-xl"
                style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#7FA38A', fontStyle: 'italic', letterSpacing: '0.02em' }}
              >
                {name}
              </p>
              <p className="text-[10px] mt-1" style={{ color: '#8A9099' }}>
                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </motion.div>
          )}

          {/* Agree checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded shrink-0 cursor-pointer"
              style={{ accentColor: '#7FA38A' }}
            />
            <span className="text-xs leading-relaxed" style={{ color: '#B8BDC7' }}>{m.agreeLabel}</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#8A9099' }}
          >
            {m.cancel}
          </button>
          <button
            onClick={handleSign}
            disabled={!name.trim() || !agreed || signing}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
            style={{ backgroundColor: '#7FA38A', color: '#0A0D14' }}
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [modalProposal, setModalProposal] = useState<any>(null);

  if (!isValid) return null;

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
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSigningId(null);
    }
  }

  if (!proposals || proposals.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-normal" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F5F1E8', letterSpacing: '-0.02em' }}>
            {pp.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8A9099' }}>{pp.subtitle}</p>
        </div>
        <div className="rounded-[16px] border p-12 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <FileSignature size={24} className="mx-auto mb-3" style={{ color: '#8A9099', opacity: 0.5 }} />
          <p className="text-sm" style={{ color: '#8A9099' }}>{pp.empty}</p>
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
          />
        )}
      </AnimatePresence>

      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-normal" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F5F1E8', letterSpacing: '-0.02em' }}>
            {pp.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8A9099' }}>{pp.subtitle}</p>
        </div>

        <div className="space-y-3">
          {proposals.map((proposal: any, i: number) => {
            const status = proposal.status as 'sent' | 'signed' | 'declined';
            const statusConfig = {
              sent:     { label: pp.status.sent,     color: '#B89B6A', bg: 'rgba(184,155,106,0.10)', border: 'rgba(184,155,106,0.22)' },
              signed:   { label: pp.status.signed,   color: '#7FA38A', bg: 'rgba(127,163,138,0.10)', border: 'rgba(127,163,138,0.22)' },
              declined: { label: pp.status.declined, color: '#A86A6A', bg: 'rgba(168,106,106,0.10)', border: 'rgba(168,106,106,0.22)' },
            }[status] || { label: status, color: '#8A9099', bg: 'rgba(138,144,153,0.10)', border: 'rgba(138,144,153,0.20)' };

            const isExpanded = expandedId === proposal.id;

            return (
              <motion.div
                key={proposal.id}
                custom={i}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="rounded-[14px] border overflow-hidden"
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(184,189,199,0.08)' }}>
                    <FileSignature size={15} style={{ color: '#B8BDC7' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#F5F1E8' }}>{proposal.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                        style={{ color: statusConfig.color, backgroundColor: statusConfig.bg, borderColor: statusConfig.border }}
                      >
                        {statusConfig.label}
                      </span>
                      {proposal.total_amount && (
                        <span className="text-[11px]" style={{ color: '#8A9099' }}>
                          {fmt(proposal.total_amount)}
                        </span>
                      )}
                      {proposal.valid_until && status === 'sent' && (
                        <span className="text-[11px]" style={{ color: '#8A9099' }}>
                          {pp.validUntil} {new Date(proposal.valid_until).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {proposal.signed_by && (
                        <span className="text-[11px]" style={{ color: '#7FA38A' }}>
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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
                        style={{ backgroundColor: 'rgba(127,163,138,0.12)', border: '1px solid rgba(127,163,138,0.25)', color: '#7FA38A' }}
                      >
                        <FileSignature size={12} />
                        {pp.signCta}
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : proposal.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                      style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#B8BDC7' }}
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
                      className="overflow-hidden border-t"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
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
