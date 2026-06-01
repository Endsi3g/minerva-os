'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Check, FileText, Loader2 } from 'lucide-react';
import { useLang } from '@/i18n';

function fmt(n: number, lang: string) {
  return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(n);
}

export default function ProposalPortalPage() {
  const { token } = useParams<{ token: string }>();
  const { t, lang, setLang } = useLang();
  const pv = t.app.clients.portal.proposalViewer;

  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signedBy, setSignedBy] = useState('');
  const [signing, setSigning] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [done, setDone] = useState<'signed' | 'declined' | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    async function fetchProposal() {
      try {
        const res = await fetch(`/api/portal/proposal?token=${token}`);
        if (res.ok) {
          const data = await res.json();
          setProposal(data);
        }
      } catch (err) {
        console.error('Failed to fetch proposal:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProposal();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0D14]">
        <Loader2 size={24} className="text-fog animate-spin" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0D14] px-4">
        <div className="text-center">
          <FileText size={48} className="text-fog/30 mx-auto mb-4" />
          <p className="text-silver text-sm">{pv.invalid}</p>
        </div>
      </div>
    );
  }

  if (done === 'signed' || proposal.status === 'signed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0D14] px-4">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-sage/15 flex items-center justify-center mx-auto">
            <Check size={28} className="text-sage" />
          </div>
          <h2
            className="text-2xl font-normal text-[#F5F1E8]"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            {pv.signedTitle}
          </h2>
          <p className="text-fog text-xs max-w-sm leading-relaxed mx-auto">
            {pv.signedDesc.replace('{name}', proposal.signedBy ? `, ${proposal.signedBy}` : '')}
          </p>
        </div>
      </div>
    );
  }

  if (done === 'declined' || proposal.status === 'declined') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0D14] px-4">
        <div className="text-center space-y-3">
          <p className="text-silver text-sm">{pv.declinedTitle}</p>
          <p className="text-fog text-xs">{pv.declinedDesc}</p>
        </div>
      </div>
    );
  }

  async function handleSign(e: React.FormEvent) {
    e.preventDefault();
    if (!signedBy.trim()) return;
    setSigning(true);
    try {
      const res = await fetch('/api/portal/proposal/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, status: 'signed', signedBy: signedBy.trim() }),
      });
      if (res.ok) {
        setProposal((prev: any) => ({ ...prev, signedBy: signedBy.trim() }));
        setDone('signed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSigning(false);
    }
  }

  async function handleDecline() {
    setDeclining(true);
    try {
      const res = await fetch('/api/portal/proposal/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, status: 'declined' }),
      });
      if (res.ok) {
        setDone('declined');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeclining(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0D14] py-16 px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[#F5F1E8] flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#0A0D14]">M</span>
            </div>
            <span className="text-sm font-semibold tracking-wide text-[#F5F1E8]">Minerva</span>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="text-xs text-[#8A9099] hover:text-[#F5F1E8] border border-white/5 px-2.5 py-1 rounded-lg bg-[#111522] transition-colors"
          >
            {lang === 'en' ? 'FR' : 'EN'}
          </button>
        </header>

        <div className="mb-10">
          <h1
            className="text-3xl md:text-4xl font-normal text-[#F5F1E8] leading-tight"
            style={{ fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.01em' }}
          >
            {proposal.title}
          </h1>
          {proposal.validUntil && (
            <p className="text-xs text-[#8A9099] mt-3">
              {pv.validUntil} {new Date(proposal.validUntil).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}
            </p>
          )}
        </div>

        <div className="space-y-10 mb-12">
          {(proposal.sections as any[]).filter((s: any) => s.content).map((section: any) => (
            <div key={section.type} className="group">
              <h2 className="text-[10px] font-semibold text-[#8A9099] uppercase tracking-widest mb-3 border-l-2 border-sage/40 pl-3">
                {(pv.sections as any)[section.type] ?? section.type}
              </h2>
              <p className="text-[#F5F1E8] text-sm leading-relaxed whitespace-pre-wrap pl-3">{section.content}</p>
            </div>
          ))}
        </div>

        <div
          className="flex items-center justify-between p-6 rounded-2xl mb-10"
          style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-xs font-medium text-[#B8BDC7]">{pv.totalInvestment}</span>
          <span className="text-2xl font-semibold text-[#F5F1E8] tabular-nums">{fmt(proposal.totalAmount, lang)}</span>
        </div>

        {proposal.status === 'sent' && (
          <div
            style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.06)' }}
            className="rounded-2xl p-8 space-y-6"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#F5F1E8]">{pv.signTitle}</h3>
              <p className="text-xs text-[#8A9099] leading-relaxed">{pv.signDesc}</p>
            </div>
            <form onSubmit={handleSign} className="space-y-4">
              <input
                value={signedBy}
                onChange={e => setSignedBy(e.target.value)}
                placeholder={pv.namePlaceholder}
                required
                className="w-full px-4 py-3 rounded-xl text-xs text-[#F5F1E8] placeholder:text-[#8A9099]/50 outline-none transition-all duration-300 focus:border-sage/30"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={signing || !signedBy.trim()}
                  className="flex-1 py-3 rounded-full text-xs font-semibold bg-[#F5F1E8] text-[#0A0D14] hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {signing ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  {pv.acceptButton}
                </button>
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={declining}
                  className="px-6 py-3 rounded-full text-xs text-[#8A9099] hover:text-[#B8BDC7] transition-all hover:bg-white/[0.02]"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {pv.declineButton}
                </button>
              </div>
            </form>
          </div>
        )}

        <p className="text-center text-[10px] text-[#8A9099]/70 mt-12">
          {pv.poweredBy}
        </p>
      </div>
    </div>
  );
}
