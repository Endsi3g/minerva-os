'use client';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { usePortalData } from './usePortalData';
import { useLang } from '@/i18n';
import type { PortalNotificationFrequency, PortalNotificationType } from '@/lib/types';

const ALL_TYPES: PortalNotificationType[] = [
  'approval_action',
  'invoice_update',
  'proposal_update',
  'file_upload',
  'comment',
];

export default function PortalSettings() {
  const { t } = useLang();
  const ps = t.portal.settings;
  const { token, isValid } = usePortalData();

  const [frequency, setFrequency] = useState<PortalNotificationFrequency>('daily');
  const [enabledTypes, setEnabledTypes] = useState<PortalNotificationType[]>([...ALL_TYPES]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/portal/notification-prefs?token=${token}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          if (d.frequency) setFrequency(d.frequency);
          if (Array.isArray(d.enabledTypes)) setEnabledTypes(d.enabledTypes);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (!isValid) return null;

  function toggleType(type: PortalNotificationType) {
    setEnabledTypes((prev: PortalNotificationType[]) =>
      prev.includes(type) ? prev.filter((t: PortalNotificationType) => t !== type) : [...prev, type]
    );
  }

  async function handleSave() {
    if (!token || saving) return;
    setSaving(true);
    try {
      await fetch('/api/portal/notification-prefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, frequency, enabledTypes }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    finally {
      setSaving(false);
    }
  }

  const freqOptions: { value: PortalNotificationFrequency; label: string }[] = [
    { value: 'instant', label: ps.frequency.instant },
    { value: 'daily',   label: ps.frequency.daily   },
    { value: 'weekly',  label: ps.frequency.weekly  },
  ];

  const typeLabels: Record<PortalNotificationType, string> = {
    approval_action:  ps.types.approvalAction,
    invoice_update:   ps.types.invoiceUpdate,
    proposal_update:  ps.types.proposalUpdate,
    file_upload:      ps.types.fileUpload,
    comment:          ps.types.comment,
  };

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h1 className="text-2xl font-normal" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F5F1E8', letterSpacing: '-0.02em' }}>
          {ps.title}
        </h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 rounded-[12px] animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">
          {/* Frequency */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8A9099' }}>
              {ps.frequency.label}
            </h2>
            <div className="space-y-2">
              {freqOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFrequency(opt.value)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-[12px] border text-left transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: frequency === opt.value ? 'rgba(127,163,138,0.07)' : 'rgba(255,255,255,0.02)',
                    borderColor: frequency === opt.value ? 'rgba(127,163,138,0.30)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-200"
                    style={{ borderColor: frequency === opt.value ? '#7FA38A' : 'rgba(255,255,255,0.20)' }}
                  >
                    {frequency === opt.value && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#7FA38A' }} />}
                  </div>
                  <p className="text-sm font-medium" style={{ color: '#F5F1E8' }}>{opt.label}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Enabled types */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8A9099' }}>
              {ps.types.label}
            </h2>
            <div className="space-y-2">
              {ALL_TYPES.map(type => {
                const active = enabledTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-[12px] border transition-all duration-200 cursor-pointer"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      borderColor: 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <span className="text-sm" style={{ color: active ? '#F5F1E8' : '#8A9099' }}>{typeLabels[type]}</span>
                    <div
                      className="h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200"
                      style={{
                        backgroundColor: active ? '#7FA38A' : 'transparent',
                        borderColor: active ? '#7FA38A' : 'rgba(255,255,255,0.15)',
                      }}
                    >
                      {active && <Check size={11} style={{ color: '#0A0D14' }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: '#F5F1E8', color: '#0A0D14' }}
          >
            {saved ? <><Check size={14} />{ps.saved}</> : saving ? '...' : ps.save}
          </button>
        </motion.div>
      )}
    </div>
  );
}
