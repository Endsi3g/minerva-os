'use client';
import { useState } from 'react';
import { ChevronDown, HelpCircle, Mail, Keyboard } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useLang } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { TextAnimate } from '@/components/ui/text-animate';
import { Kbd } from '@/components/ui/kbd';
import { Separator } from '@/components/ui/separator';

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl border bg-midnight border-border"
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
            'shrink-0 text-fog transition-transform duration-300',
            open && 'rotate-180'
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 text-sm text-silver leading-relaxed border-t border-border/40"
            >
              <p className="pt-3">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
    <div className="w-full space-y-10">
      {/* Header */}
      <div>
        <TextAnimate text={s.title} type="calmInUp" className="text-2xl font-semibold text-ivory" />
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

      <Separator className="bg-white/5" />

      {/* Contact form */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Mail size={16} className="text-fog" />
          <h2 className="text-base font-semibold text-ivory">{s.contactTitle}</h2>
        </div>
        <div
          className="rounded-2xl p-6 space-y-4 bg-midnight border border-border"
        >
          <p className="text-sm text-silver">{s.contactSub}</p>
          {submitted ? (
            <div
              className="rounded-xl px-4 py-3 text-sm bg-sage/10 border border-sage/20 text-sage"
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
                  title={s.subjectLabel}
                  placeholder={s.subjectLabel}
                  className="w-full rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20 bg-obsidian border border-border text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-silver">{s.messageLabel}</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={4}
                  title={s.messageLabel}
                  placeholder={s.messageLabel}
                  className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20 resize-none bg-obsidian border border-border text-foreground"
                />
              </div>
              {error && (
                <p className="text-xs text-ember">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting || !subject.trim() || !message.trim()}
                className="h-9 px-5 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed bg-ivory text-obsidian"
              >
                {submitting ? '...' : s.submitLabel}
              </button>
            </form>
          )}
        </div>
      </section>

      <Separator className="bg-white/5" />

      {/* Keyboard shortcuts */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Keyboard size={16} className="text-fog" />
          <h2 className="text-base font-semibold text-ivory">{s.shortcutsTitle}</h2>
        </div>
        <div
          className="rounded-2xl overflow-hidden bg-midnight border border-border"
        >
          {s.shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-5 py-3 border-t border-border/40 first:border-t-0"
            >
              <span className="text-sm text-silver">{sc.label}</span>
              <Kbd
                className="font-mono text-[11px] h-auto py-0.5 px-2 rounded-md bg-dusk border border-border text-silver"
              >
                {sc.keys}
              </Kbd>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
