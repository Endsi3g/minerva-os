'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { usePortalData } from './usePortalData';
import { useLang } from '@/i18n';
import { Button } from '@/components/ui/button';
import PortalEmailGate from './PortalEmailGate';
import PortalExpired from './PortalExpired';
import PortalNotificationBell from './PortalNotificationBell';
import PortalCopilot from './PortalCopilot';
import { supabase } from '@/lib/supabase';

function PortalLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header
        className="sticky top-0 z-50 bg-background/95 border-b border-border"
        style={{ backdropFilter: 'blur(16px)' }}
      >
        <div className="max-w-5xl mx-auto px-5">
          <div className="h-14 flex items-center gap-3">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="h-6 w-6 rounded-md flex items-center justify-center shrink-0 bg-foreground">
                <span className="text-[10px] font-bold text-background">M</span>
              </div>
              <span className="text-sm font-semibold tracking-wide text-foreground">Minerva</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <span className="text-sm text-muted-foreground">Client Portal</span>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-5 py-10">
        <div className="space-y-4">
          <div className="h-8 w-48 rounded-xl animate-pulse bg-muted" />
          <div className="h-4 w-72 rounded-xl animate-pulse bg-muted" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 rounded-xl animate-pulse bg-muted" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const token = params?.token as string | undefined;
  const { t, lang, setLang } = useLang();
  const pathname = usePathname();
  const router = useRouter();

  const {
    clientName,
    workspaceId,
    isValid,
    loading,
    needsVerification,
    isExpired,
    scopes,
    refresh,
  } = usePortalData();

  const [wsLogo, setWsLogo] = useState<string | undefined>();
  const [wsBrandColor, setWsBrandColor] = useState<string | undefined>();
  const [wsName, setWsName] = useState<string | undefined>();

  useEffect(() => {
    if (!workspaceId) return;
    supabase.from('workspaces').select('name, logo_url, settings, branding').eq('id', workspaceId).maybeSingle().then(({ data }) => {
      if (data) {
        setWsName(data.name ?? undefined);
        setWsLogo(data.logo_url ?? undefined);
        setWsBrandColor(data.branding?.primaryColor ?? data.settings?.brand_color ?? undefined);
      }
    });
  }, [workspaceId]);

  const PORTAL_TABS = [
    { label: t.app.sidebar.dashboard,        path: '',             scope: null },
    { label: t.app.sidebar.approvals,        path: 'deliverables', scope: 'approvals' },
    { label: t.portal.proposals.tabLabel,    path: 'proposals',    scope: 'proposals' },
    { label: t.app.sidebar.files,            path: 'files',        scope: 'files' },
    { label: t.app.sidebar.billing,          path: 'invoices',     scope: 'invoices' },
    { label: t.portal.reports.tabLabel,      path: 'reports',      scope: 'reports' },
    { label: t.portal.journal.tabLabel,      path: 'journal',      scope: null },
    { label: t.portal.timeline.tabLabel,     path: 'timeline',     scope: null },
    { label: t.app.sidebar.tickets,          path: 'tickets',      scope: 'tickets' },
    { label: t.app.sidebar.nps,              path: 'nps',          scope: 'nps' },
    { label: t.portal.messages.tabLabel,     path: 'messages',     scope: null },
  ];

  // Block unauthorized direct URL access
  useEffect(() => {
    if (loading || !token || !isValid) return;

    const currentTab = PORTAL_TABS.find(tab => {
      if (tab.path === '') {
        return pathname === `/portal/${token}` || pathname === `/portal/${token}/`;
      }
      return pathname?.endsWith(`/${tab.path}`);
    });

    if (currentTab && currentTab.scope && !scopes.includes(currentTab.scope)) {
      router.replace(`/portal/${token}`);
    }
  }, [loading, token, isValid, pathname, scopes, router]);

  if (loading) return <PortalLoadingSkeleton />;
  if (isExpired) return <PortalExpired />;
  if (needsVerification && token) {
    return <PortalEmailGate token={token} onVerified={refresh} />;
  }
  if (!isValid) return <PortalExpired />;

  const visibleTabs = PORTAL_TABS.filter(tab => !tab.scope || scopes.includes(tab.scope));

  const accentColor = wsBrandColor ?? '#7FA38A';
  const wsInitials = (wsName ?? 'M').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "'Inter', sans-serif", '--portal-accent': accentColor } as React.CSSProperties}
    >
      {/* Sticky header */}
      <header
        className="sticky top-0 z-50 bg-background/95 border-b border-border"
        style={{ backdropFilter: 'blur(16px)' }}
      >
        <div className="max-w-5xl mx-auto px-5">
          {/* Top bar */}
          <div className="h-14 flex items-center gap-3">
            {/* Brand mark */}
            <div className="flex items-center gap-2.5 shrink-0">
              {wsLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={wsLogo} alt={wsName ?? 'Logo'} className="h-6 w-6 rounded-md object-cover shrink-0" />
              ) : (
                <div
                  className="h-6 w-6 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold"
                  style={{ backgroundColor: accentColor, color: '#0A0D14' }}
                >
                  {wsInitials}
                </div>
              )}
              <span className="text-sm font-semibold tracking-wide text-foreground">
                {wsName ?? 'Minerva'}
              </span>
            </div>

            <div className="h-4 w-px bg-border" />
            <span className="text-sm text-muted-foreground">Client Portal</span>

            {/* Client badge */}
            <div
              className="px-2.5 py-1 rounded-full text-xs font-medium text-emerald-600 border"
              style={{ backgroundColor: 'rgba(5,150,105,0.08)', borderColor: 'rgba(5,150,105,0.22)' }}
            >
              {clientName}
            </div>

            <div className="flex-1" />

            {/* Notification bell */}
            {token && <PortalNotificationBell token={token} />}

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
              className="text-xs text-muted-foreground hover:text-foreground border border-border h-8 px-2.5 rounded-lg"
            >
              {lang === 'en' ? 'FR' : 'EN'}
            </Button>

            <Link
              href="/"
              className="text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              &larr; {t.nav.back}
            </Link>
          </div>

          {/* Tab bar */}
          <div className="flex gap-0 -mb-px overflow-x-auto scrollbar-none">
            {visibleTabs.map(tab => {
              const href = tab.path === '' ? `/portal/${token}` : `/portal/${token}/${tab.path}`;
              const isActive = tab.path === ''
                ? pathname === `/portal/${token}` || pathname === `/portal/${token}/`
                : !!pathname?.endsWith(`/${tab.path}`);
              return (
                <Link
                  key={tab.path}
                  href={href}
                  className={`px-4 py-2.5 text-sm border-b-2 transition-colors duration-200 whitespace-nowrap ${
                    isActive ? 'text-foreground font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  style={isActive ? { borderColor: accentColor } : {}}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-5 py-10">
        {children}
      </main>

      {/* Copilot — floating, outside main */}
      <PortalCopilot />
    </div>
  );
}
