'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, Settings } from 'lucide-react';
import Link from 'next/link';
import { useLang } from '@/i18n';
import type { PortalNotification } from '@/lib/types';

interface Props {
  token: string;
}

export default function PortalNotificationBell({ token }: Props) {
  const { t } = useLang();
  const pn = t.portal.notifications;
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/portal/notifications?token=${token}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setNotifications(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function markAllRead() {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (!unreadIds.length) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await fetch('/api/portal/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ids: unreadIds }),
      });
    } catch {}
  }

  const typeIconColor: Record<string, string> = {
    approval_action: '#B89B6A',
    invoice_update: '#7FA38A',
    proposal_update: '#B8BDC7',
    file_upload: '#8A9099',
    comment: '#B8BDC7',
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg transition-colors duration-200 hover:bg-white/5 cursor-pointer"
        aria-label="Notifications"
      >
        <Bell size={15} style={{ color: '#8A9099' }} />
        {unread > 0 && (
          <span
            className="absolute top-0.5 right-0.5 h-4 min-w-4 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ backgroundColor: '#B89B6A', color: '#0A0D14', padding: '0 2px' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-[16px] border overflow-hidden z-50"
            style={{ backgroundColor: '#111522', borderColor: 'rgba(255,255,255,0.10)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <span className="text-xs font-semibold" style={{ color: '#F5F1E8' }}>{pn.title}</span>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-[10px] hover:underline cursor-pointer" style={{ color: '#7FA38A' }}>
                    <Check size={10} className="inline mr-0.5" />
                    {pn.markAllRead}
                  </button>
                )}
                <Link href={`/portal/${token}/settings`} onClick={() => setOpen(false)}>
                  <Settings size={13} style={{ color: '#8A9099' }} />
                </Link>
              </div>
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto">
              {loading && (
                <div className="space-y-2 p-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />)}
                </div>
              )}
              {!loading && notifications.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-xs" style={{ color: '#8A9099' }}>{pn.empty}</p>
                </div>
              )}
              {!loading && notifications.map(n => (
                <Link
                  key={n.id}
                  href={n.targetPath ? `/portal/${token}/${n.targetPath}` : `/portal/${token}`}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 transition-colors duration-150 hover:bg-white/5 block"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div
                    className="h-2 w-2 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: n.read ? 'transparent' : typeIconColor[n.type] || '#B8BDC7' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: n.read ? '#8A9099' : '#F5F1E8' }}>{n.title}</p>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: '#8A9099' }}>{n.message}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
