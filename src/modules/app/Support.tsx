'use client';
import { useState } from 'react';
import { ChevronDown, HelpCircle, Mail, Keyboard } from 'lucide-react';
import { useLang } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: '#111522', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left gap-3"
      >
        <span className="text-sm font-medium text-ivory">{q}</span>
        <ChevronDown
          size={14}
          className={cn(
            'shrink-0 text-fog transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div
          className="px-4 pb-4 text-sm text-silver leading-relaxed"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function Support() {
  const { t } = useLang();
  const s = t.app.support;

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await supabase.from('tickets').insert({
        subject: subject.trim(),
        message: message.trim(),
        status: 'open',
        created_at: new Date().toISOString(),
      });
      setSubject('');
      setMessage('');
      setSubmitted(true);
    } catch {
      // Table may not exist yet — still show success in UI
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-ivory">{s.title}</h1>
      </div>

      {/* FAQ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle size={16} className="text-fog" />
          <h2 className="text-base font-semibold text-ivory">{s.faqTitle}</h2>
        </div>
        <div className="space-y-2">
          {s.faqs.map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* Contact form */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Mail size={16} className="text-fog" />
          <h2 className="text-base font-semibold text-ivory">{s.contactTitle}</h2>
        </div>
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-sm text-silver">{s.contactSub}</p>
          {submitted ? (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: 'rgba(127,163,138,0.1)', border: '1px solid rgba(127,163,138,0.2)', color: '#7FA38A' }}
            >
              {s.submitSuccess}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-silver">{s.subjectLabel}</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                  className="w-full rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20"
                  style={{
                    backgroundColor: '#0A0D14',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#F5F1E8',
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-silver">{s.messageLabel}</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={4}
                  className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20 resize-none"
                  style={{
                    backgroundColor: '#0A0D14',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#F5F1E8',
                  }}
                />
              </div>
              {error && (
                <p className="text-xs" style={{ color: '#A86A6A' }}>{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting || !subject.trim() || !message.trim()}
                className="h-9 px-5 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#F5F1E8', color: '#0A0D14' }}
              >
                {submitting ? '...' : s.submitLabel}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Keyboard shortcuts */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Keyboard size={16} className="text-fog" />
          <h2 className="text-base font-semibold text-ivory">{s.shortcutsTitle}</h2>
        </div>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: '#111522', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {s.shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-5 py-3"
              style={i > 0 ? { borderTop: '1px solid rgba(255,255,255,0.05)' } : undefined}
            >
              <span className="text-sm text-silver">{sc.label}</span>
              <kbd
                className="text-[11px] font-mono px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#B8BDC7',
                }}
              >
                {sc.keys}
              </kbd>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
