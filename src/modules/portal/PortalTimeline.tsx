'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Upload, CheckCircle2, AlertCircle, MessageSquare, LogIn, CreditCard, FileSignature, Milestone } from 'lucide-react';
import { usePortalData } from './usePortalData';
import { useLang } from '@/i18n';
import type { TimelineEvent, TimelineEventType } from '@/lib/types';

const EVENT_CONFIG: Record<TimelineEventType, { icon: React.ElementType; color: string }> = {
  file_uploaded:       { icon: Upload,        color: '#B8BDC7' },
  approval_submitted:  { icon: CheckCircle2,  color: '#B89B6A' },
  approval_approved:   { icon: CheckCircle2,  color: '#7FA38A' },
  approval_revision:   { icon: AlertCircle,   color: '#A86A6A' },
  comment_added:       { icon: MessageSquare, color: '#8A9099' },
  portal_accessed:     { icon: LogIn,         color: '#8A9099' },
  invoice_paid:        { icon: CreditCard,    color: '#7FA38A' },
  proposal_signed:     { icon: FileSignature, color: '#7FA38A' },
  milestone_completed: { icon: Milestone,     color: '#7FA38A' },
};

export default function PortalTimeline() {
  const { t, lang } = useLang();
  const pt = t.portal.timeline;
  const { token, isValid } = usePortalData();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/portal/timeline?token=${token}&page=1`)
      .then(r => r.ok ? r.json() : { events: [], hasMore: false })
      .then(d => { setEvents(d.events ?? []); setHasMore(d.hasMore ?? false); })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [token]);

  async function loadMore() {
    if (!token) return;
    const nextPage = page + 1;
    const res = await fetch(`/api/portal/timeline?token=${token}&page=${nextPage}`);
    if (!res.ok) return;
    const d = await res.json();
    setEvents(prev => [...prev, ...(d.events ?? [])]);
    setHasMore(d.hasMore ?? false);
    setPage(nextPage);
  }

  if (!isValid) return null;

  function relativeDate(ts: string) {
    const diff = Date.now() - new Date(ts).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return new Date(ts).toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return lang === 'fr' ? 'hier' : 'yesterday';
    if (days < 7) return lang === 'fr' ? `il y a ${days} j` : `${days}d ago`;
    return new Date(ts).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' });
  }

  const eventLabelMap: Record<TimelineEventType, string> = {
    file_uploaded: pt.events.fileUploaded,
    approval_submitted: pt.events.approvalSubmitted,
    approval_approved: pt.events.approvalApproved,
    approval_revision: pt.events.approvalRevision,
    comment_added: pt.events.commentAdded,
    portal_accessed: pt.events.portalAccessed,
    invoice_paid: pt.events.invoicePaid,
    proposal_signed: pt.events.proposalSigned,
    milestone_completed: pt.events.milestoneCompleted,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-normal" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F5F1E8', letterSpacing: '-0.02em' }}>
          {pt.title}
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8A9099' }}>{pt.subtitle}</p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 rounded-[12px] animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="rounded-[16px] border p-12 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-sm" style={{ color: '#8A9099' }}>{pt.empty}</p>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[17px] top-3 bottom-3 w-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />

          <div className="space-y-1">
            {events.map((event, i) => {
              const cfg = EVENT_CONFIG[event.type] || { icon: CheckCircle2, color: '#8A9099' };
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.35 }}
                  className="flex items-start gap-4 pl-1 pr-3 py-2.5"
                >
                  {/* Dot */}
                  <div
                    className="h-[34px] w-[34px] rounded-full flex items-center justify-center shrink-0 relative z-10"
                    style={{ backgroundColor: '#0A0D14', border: `1.5px solid rgba(255,255,255,0.10)` }}
                  >
                    <Icon size={13} style={{ color: cfg.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm" style={{ color: '#F5F1E8' }}>
                      <span style={{ color: '#B8BDC7' }}>{event.actor}</span>
                      {' '}
                      <span style={{ color: '#8A9099' }}>{eventLabelMap[event.type]}</span>
                      {event.targetName && (
                        <> <span style={{ color: '#F5F1E8' }}>{event.targetName}</span></>
                      )}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <span className="text-[11px] shrink-0 pt-1" style={{ color: '#8A9099' }}>
                    {relativeDate(event.timestamp)}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {hasMore && (
            <div className="pt-4 text-center">
              <button
                onClick={loadMore}
                className="text-xs px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-white/5 cursor-pointer"
                style={{ color: '#8A9099', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {pt.loadMore}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
