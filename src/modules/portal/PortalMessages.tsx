'use client';
import { motion } from 'motion/react';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortalData } from './usePortalData';
import { useLang } from '@/i18n';
import type { PortalMessage } from '@/lib/types';

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 },
  }),
};

function relativeDate(iso: string, lang: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) {
    const hours = Math.floor(diff / 3600000);
    if (hours === 0) return lang === 'fr' ? 'À l\'instant' : 'Just now';
    return lang === 'fr' ? `Il y a ${hours}h` : `${hours}h ago`;
  }
  if (days === 1) return lang === 'fr' ? 'Hier' : 'Yesterday';
  if (days < 7) return lang === 'fr' ? `Il y a ${days} jours` : `${days} days ago`;
  return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric', month: 'short',
  });
}

function MessageBubble({ msg, index, lang, newBadge }: { msg: PortalMessage; index: number; lang: string; newBadge: string }) {
  const isWorkspace = msg.fromWorkspace;
  const isNew = !msg.readAt;
  const initials = msg.authorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <motion.div
      custom={index}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={cn('flex gap-3', isWorkspace ? 'flex-row' : 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div className={cn(
        'h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-1',
        isWorkspace ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
      )}>
        {initials}
      </div>

      {/* Bubble */}
      <div className={cn('flex flex-col gap-1 max-w-[80%]', isWorkspace ? 'items-start' : 'items-end')}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-foreground">{msg.authorName}</span>
          {isNew && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {newBadge}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">{relativeDate(msg.sentAt, lang)}</span>
        </div>
        <div className={cn(
          'rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isWorkspace
            ? 'bg-surface border border-border text-foreground rounded-tl-sm'
            : 'bg-primary/10 border border-primary/15 text-foreground rounded-tr-sm'
        )}>
          {msg.body}
        </div>
      </div>
    </motion.div>
  );
}

export default function PortalMessages() {
  const { t, lang } = useLang();
  const pm = t.portal.messages;
  const { isValid, messages } = usePortalData();

  if (!isValid) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div custom={0} variants={fadeInUp} initial="hidden" animate="visible">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare size={16} className="text-primary" />
          <h1
            className="text-2xl font-normal text-foreground"
            style={{ fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' }}
          >
            {pm.title}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">{pm.subtitle}</p>
      </motion.div>

      {/* Thread */}
      {messages.length === 0 ? (
        <motion.div custom={1} variants={fadeInUp} initial="hidden" animate="visible"
          className="flex flex-col items-center gap-3 py-16 text-center"
        >
          <MessageSquare size={32} className="text-muted-foreground opacity-40" />
          <p className="text-sm font-medium text-foreground">{pm.empty}</p>
          <p className="text-xs text-muted-foreground max-w-xs">{pm.emptyDesc}</p>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {messages.map((msg, i) => (
            <MessageBubble key={msg.id} msg={msg} index={i + 1} lang={lang} newBadge={pm.newBadge} />
          ))}
        </div>
      )}
    </div>
  );
}
