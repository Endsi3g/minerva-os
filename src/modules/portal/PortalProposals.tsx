'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileSignature, Check, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
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

export default function PortalProposals() {
  const { t, lang } = useLang();
  const pp = t.portal.proposals;
  const { isValid, proposals, token } = usePortalData();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [signingId, setSigningId] = useState<string | null>(null);

  if (!isValid) return null;

  async function handleSign(proposalId: string) {
    if (!token || signingId) return;
    setSigningId(proposalId);
    try {
      const res = await fetch('/api/portal/proposal/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, proposalId, action: 'sign' }),
      });
      if (res.ok) {
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
                      onClick={() => handleSign(proposal.id)}
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
  );
}
