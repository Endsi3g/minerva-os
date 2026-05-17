'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Check, FileText, Loader2 } from 'lucide-react';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function ProposalPortalPage() {
  const { token } = useParams<{ token: string }>();

  const proposal = useQuery(api.proposals.getByToken as any, token ? { token } : 'skip');
  const sign = useMutation(api.proposals.sign as any);
  const decline = useMutation(api.proposals.decline as any);

  const [signedBy, setSignedBy] = useState('');
  const [signing, setSigning] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [done, setDone] = useState<'signed' | 'declined' | null>(null);

  if (proposal === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0D14]">
        <Loader2 size={24} className="text-fog animate-spin" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0D14]">
        <div className="text-center">
          <FileText size={48} className="text-fog/30 mx-auto mb-4" />
          <p className="text-silver">This proposal link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  if (done === 'signed' || proposal.status === 'signed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0D14]">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-sage/15 flex items-center justify-center mx-auto">
            <Check size={28} className="text-sage" />
          </div>
          <h2 className="text-xl font-semibold text-ivory">Proposal signed</h2>
          <p className="text-fog text-sm max-w-sm">
            Thank you{proposal.signedBy ? `, ${proposal.signedBy}` : ''}. Your signature has been recorded.
            The agency has been notified and will be in touch shortly.
          </p>
        </div>
      </div>
    );
  }

  if (done === 'declined' || proposal.status === 'declined') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0D14]">
        <div className="text-center space-y-3">
          <p className="text-silver">You have declined this proposal.</p>
          <p className="text-fog text-sm">The agency has been notified.</p>
        </div>
      </div>
    );
  }

  const SECTION_LABELS: Record<string, string> = {
    intro: 'Introduction', scope: 'Scope of Work', timeline: 'Timeline',
    pricing: 'Pricing', terms: 'Terms & Conditions',
  };

  async function handleSign(e: React.FormEvent) {
    e.preventDefault();
    if (!signedBy.trim()) return;
    setSigning(true);
    await sign({ token, signedBy: signedBy.trim() });
    setDone('signed');
    setSigning(false);
  }

  async function handleDecline() {
    setDeclining(true);
    await decline({ token });
    setDone('declined');
    setDeclining(false);
  }

  return (
    <div className="min-h-screen bg-[#0A0D14] py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-6 w-6 rounded-md bg-[#F5F1E8] flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#0A0D14]">M</span>
            </div>
            <span className="text-sm font-semibold text-[#F5F1E8]">Minerva</span>
          </div>
          <h1 className="text-3xl font-bold text-[#F5F1E8]">{proposal.title}</h1>
          {proposal.validUntil && (
            <p className="text-sm text-[#8A9099] mt-2">
              Valid until {new Date(proposal.validUntil).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="space-y-8 mb-10">
          {(proposal.sections as any[]).filter((s: any) => s.content).map((section: any) => (
            <div key={section.type}>
              <h2 className="text-sm font-semibold text-[#B8BDC7] uppercase tracking-widest mb-3">
                {SECTION_LABELS[section.type] ?? section.type}
              </h2>
              <p className="text-[#F5F1E8] text-sm leading-relaxed whitespace-pre-wrap">{section.content}</p>
            </div>
          ))}
        </div>

        <div
          className="flex items-center justify-between p-5 rounded-xl mb-8"
          style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className="text-sm text-[#B8BDC7]">Total investment</span>
          <span className="text-2xl font-bold text-[#F5F1E8] tabular-nums">{fmt(proposal.totalAmount)}</span>
        </div>

        {proposal.status === 'sent' && (
          <div style={{ background: '#111522', border: '1px solid rgba(255,255,255,0.08)' }} className="rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#F5F1E8] mb-1">Sign this proposal</h3>
            <p className="text-xs text-[#8A9099] mb-4">
              By signing, you agree to the terms outlined in this proposal and authorize the agency to begin work.
            </p>
            <form onSubmit={handleSign} className="space-y-3">
              <input
                value={signedBy}
                onChange={e => setSignedBy(e.target.value)}
                placeholder="Your full name"
                required
                className="w-full px-3 py-2 rounded-lg text-sm text-[#F5F1E8] placeholder:text-[#8A9099] outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={signing || !signedBy.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#F5F1E8] text-[#0A0D14] hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {signing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Accept & Sign
                </button>
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={declining}
                  className="px-4 py-2.5 rounded-xl text-sm text-[#8A9099] hover:text-[#B8BDC7] transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Decline
                </button>
              </div>
            </form>
          </div>
        )}

        <p className="text-center text-[10px] text-[#8A9099] mt-8">
          Powered by Minerva OS · Uprising Studio
        </p>
      </div>
    </div>
  );
}
