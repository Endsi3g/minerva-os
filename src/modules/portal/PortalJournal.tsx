'use client';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, RefreshCcw, FileText, FileSignature } from 'lucide-react';
import { usePortalData } from './usePortalData';
import { useLang } from '@/i18n';
import type { DecisionEntry } from '@/lib/types';

const fadeInUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 } }),
};

function DecisionIcon({ type }: { type: string }) {
  if (type === 'invoice') return <FileText size={13} style={{ color: '#B8BDC7' }} />;
  if (type === 'proposal') return <FileSignature size={13} style={{ color: '#B8BDC7' }} />;
  return <Check size={13} style={{ color: '#B8BDC7' }} />;
}

function decisionColor(decision: string): { color: string; bg: string; border: string } {
  if (decision === 'approved' || decision === 'paid' || decision === 'signed') {
    return { color: '#7FA38A', bg: 'rgba(127,163,138,0.10)', border: 'rgba(127,163,138,0.22)' };
  }
  if (decision === 'revision' || decision === 'declined') {
    return { color: '#A86A6A', bg: 'rgba(168,106,106,0.10)', border: 'rgba(168,106,106,0.22)' };
  }
  return { color: '#8A9099', bg: 'rgba(138,144,153,0.10)', border: 'rgba(138,144,153,0.20)' };
}

export default function PortalJournal() {
  const { t, lang } = useLang();
  const pj = t.portal.journal;
  const { token, isValid } = usePortalData();
  const [entries, setEntries] = useState<DecisionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/portal/decisions?token=${token}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setEntries(Array.isArray(d) ? d : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (!isValid) return null;

  const decisionLabel: Record<string, string> = {
    approved: pj.decisions.approved,
    revision: pj.decisions.revision,
    paid: pj.decisions.paid,
    signed: pj.decisions.signed,
    declined: pj.decisions.declined,
  };

  const typeLabel: Record<string, string> = {
    approval: pj.types.approval,
    invoice: pj.types.invoice,
    proposal: pj.types.proposal,
  };

  function relativeDate(ts: string) {
    const diff = Date.now() - new Date(ts).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return lang === 'fr' ? "aujourd'hui" : 'today';
    if (days === 1) return lang === 'fr' ? 'hier' : 'yesterday';
    if (days < 7) return lang === 'fr' ? `il y a ${days} jours` : `${days} days ago`;
    return new Date(ts).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-normal" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F5F1E8', letterSpacing: '-0.02em' }}>
          {pj.title}
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8A9099' }}>{pj.subtitle}</p>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-[12px] animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="rounded-[16px] border p-12 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <RefreshCcw size={22} className="mx-auto mb-3" style={{ color: '#8A9099', opacity: 0.4 }} />
          <p className="text-sm" style={{ color: '#8A9099' }}>{pj.empty}</p>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry: DecisionEntry, i: number) => {
            const dc = decisionColor(entry.decision);
            return (
              <motion.div
                key={entry.id}
                custom={i}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="flex items-start gap-4 px-4 py-3.5 rounded-[12px] border"
                style={{ backgroundColor: 'rgba(255,255,255,0.015)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                {/* Icon */}
                <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <DecisionIcon type={entry.objectType} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate" style={{ color: '#F5F1E8' }}>{entry.objectName}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium" style={{ color: dc.color, backgroundColor: dc.bg, borderColor: dc.border }}>
                      {decisionLabel[entry.decision] || entry.decision}
                    </span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: '#8A9099' }}>
                    {typeLabel[entry.objectType] || entry.objectType}
                    {entry.decidedBy !== 'system' && (
                      <> · {pj.decidedBy} {entry.decidedBy}</>
                    )}
                  </p>
                  {entry.note && (
                    <p className="text-xs mt-1.5 px-3 py-1.5 rounded-lg" style={{ color: '#B8BDC7', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                      {entry.note}
                    </p>
                  )}
                </div>

                {/* Timestamp */}
                <span className="text-[11px] shrink-0 mt-0.5" style={{ color: '#8A9099' }}>
                  {relativeDate(entry.timestamp)}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
