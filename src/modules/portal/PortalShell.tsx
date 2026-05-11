'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { NavLink } from '@/components/ui/nav-link';
import { MOCK_PORTAL_TOKENS } from '@/lib/mock-data';

const PORTAL_TABS = [
  { label: 'Overview',     path: '' },
  { label: 'Deliverables', path: 'deliverables' },
  { label: 'Files',        path: 'files' },
  { label: 'Invoices',     path: 'invoices' },
];

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const token = params?.token as string | undefined;
  const portalToken = MOCK_PORTAL_TOKENS.find(t => t.token === token);
  const router = useRouter();

  useEffect(() => {
    if (!portalToken) router.replace('/');
  }, [portalToken, router]);

  if (!portalToken) return null;

  const { clientName } = portalToken;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0D14', fontFamily: "'Inter', sans-serif" }}>
      {/* Sticky header */}
      <header
        className="sticky top-0 z-50"
        style={{
          backgroundColor: 'rgba(10,13,20,0.96)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="max-w-5xl mx-auto px-5">
          {/* Top bar */}
          <div className="h-14 flex items-center gap-3">
            {/* Brand mark */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div
                className="h-6 w-6 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#F5F1E8' }}
              >
                <span className="text-[10px] font-bold" style={{ color: '#0A0D14' }}>M</span>
              </div>
              <span className="text-sm font-semibold tracking-wide" style={{ color: '#F5F1E8' }}>
                Minerva
              </span>
            </div>

            <div className="h-4 w-px" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }} />
            <span className="text-sm" style={{ color: '#8A9099' }}>Client Portal</span>

            {/* Client badge */}
            <div
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: 'rgba(127,163,138,0.10)',
                border: '1px solid rgba(127,163,138,0.22)',
                color: '#7FA38A',
              }}
            >
              {clientName}
            </div>

            <div className="flex-1" />

            <Link
              href="/"
              className="text-xs transition-colors duration-200 hover:text-white/60"
              style={{ color: '#8A9099' }}
            >
              ← Back to site
            </Link>
          </div>

          {/* Tab bar */}
          <div className="flex gap-0 -mb-px">
            {PORTAL_TABS.map(tab => (
              <NavLink
                key={tab.label}
                href={tab.path === '' ? `/portal/${token}` : `/portal/${token}/${tab.path}`}
                end={tab.path === ''}
                className={({ isActive }) =>
                  `px-4 py-2.5 text-sm border-b-2 transition-colors duration-200 ${
                    isActive
                      ? 'border-[#7FA38A] text-[#F5F1E8] font-medium'
                      : 'border-transparent text-[#8A9099] hover:text-[#B8BDC7]'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-5 py-10">
        {children}
      </main>
    </div>
  );
}
