import { ArrowRight, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang, type Lang } from '../i18n';

/* ── Lang toggle ──────────────────────────────────────────────────────────── */

function LangToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLang();
  const opts: Lang[] = ['en', 'fr'];

  if (compact) {
    return (
      <div
        className="flex items-center self-start rounded-full px-1 py-1 gap-0.5"
        style={{ border: '1px solid rgba(255,255,255,0.13)' }}
      >
        {opts.map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-200"
            style={{
              backgroundColor: lang === l ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: lang === l ? '#F5F1E8' : 'rgba(184,189,199,0.45)',
            }}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex items-center rounded-full px-1 py-1 gap-0.5"
      style={{ border: '1px solid rgba(255,255,255,0.13)' }}
    >
      {opts.map((l, i) => (
        <span key={l} className="flex items-center">
          <button
            onClick={() => setLang(l)}
            className="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200"
            style={{
              backgroundColor: lang === l ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: lang === l ? '#F5F1E8' : 'rgba(184,189,199,0.4)',
            }}
          >
            {l.toUpperCase()}
          </button>
          {i === 0 && (
            <span
              className="text-xs select-none"
              style={{ color: 'rgba(255,255,255,0.18)' }}
            >
              /
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

/* ── Hamburger ────────────────────────────────────────────────────────────── */

function HamburgerButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden relative w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300"
      style={{ backgroundColor: open ? 'rgba(255,255,255,0.07)' : 'transparent' }}
      aria-label="Toggle menu"
    >
      <span
        className="absolute transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{
          opacity: open ? 0 : 1,
          transform: open ? 'rotate(-90deg) scale(0.5)' : 'rotate(0deg) scale(1)',
        }}
      >
        <Menu size={20} color="#F5F1E8" strokeWidth={1.5} />
      </span>
      <span
        className="absolute transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.5)',
        }}
      >
        <X size={20} color="#F5F1E8" strokeWidth={1.5} />
      </span>
    </button>
  );
}

/* ── Mobile menu ──────────────────────────────────────────────────────────── */

const NAV_PATHS = ['/platform', '/modules', '/portal', '/security', '/insights'];

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLang();
  const location = useLocation();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <div
        className="fixed inset-0 z-30 lg:hidden"
        style={{
          backdropFilter: open ? 'blur(12px)' : 'blur(0px)',
          backgroundColor: open ? 'rgba(10,13,20,0.65)' : 'rgba(10,13,20,0)',
          pointerEvents: open ? 'auto' : 'none',
          transition: 'backdrop-filter 0.5s ease, background-color 0.5s ease',
        }}
        onClick={onClose}
      />

      <div
        className="fixed top-0 left-0 right-0 z-40 lg:hidden"
        style={{
          transform: open ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.45s cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      >
        <div
          className="pt-[72px] pb-8 px-5 overflow-y-auto"
          style={{
            maxHeight: '100svh',
            backgroundColor: 'rgba(10,13,20,0.98)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex flex-col gap-1 mt-2">
            {t.nav.items.map((item, i) => (
              <Link
                key={item}
                to={NAV_PATHS[i]}
                onClick={onClose}
                className="text-base py-3 px-3 rounded-xl flex items-center justify-between group"
                style={{
                  color: location.pathname === NAV_PATHS[i] ? '#F5F1E8' : 'rgba(245,241,232,0.65)',
                  backgroundColor: location.pathname === NAV_PATHS[i] ? 'rgba(255,255,255,0.05)' : 'transparent',
                  opacity: open ? 1 : 0,
                  transform: open ? 'translateY(0)' : 'translateY(-6px)',
                  transition: `opacity 0.35s cubic-bezier(0.23,1,0.32,1) ${i * 45 + 60}ms, transform 0.35s cubic-bezier(0.23,1,0.32,1) ${i * 45 + 60}ms`,
                }}
              >
                {item}
                <ArrowRight
                  size={14}
                  className="-translate-x-1 group-hover:translate-x-0 group-hover:opacity-40 opacity-0 transition-all duration-200"
                  color="#B8BDC7"
                />
              </Link>
            ))}
          </div>

          <div
            className="mt-6 pt-5 flex flex-col gap-3"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.07)',
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0)' : 'translateY(-6px)',
              transition: `opacity 0.35s cubic-bezier(0.23,1,0.32,1) 300ms, transform 0.35s cubic-bezier(0.23,1,0.32,1) 300ms`,
            }}
          >
            <LangToggle compact />
            <Link
              to="/login"
              onClick={onClose}
              className="w-full py-3 rounded-full text-center text-sm font-medium transition-all duration-200"
              style={{ color: '#B8BDC7', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              {t.nav.signIn}
            </Link>
            <Link
              to="/signup"
              onClick={onClose}
              className="w-full py-3 rounded-full text-center text-sm font-medium transition-all duration-200 hover:opacity-85 active:scale-[0.98]"
              style={{ backgroundColor: '#F5F1E8', color: '#0A0D14' }}
            >
              {t.nav.requestAccess}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Header ───────────────────────────────────────────────────────────────── */

export default function Header() {
  const [open, setOpen] = useState(false);
  const { t } = useLang();
  const location = useLocation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4 lg:px-10 lg:py-6">
        {/* Brand */}
        <Link
          to="/"
          className="text-xl font-semibold tracking-tight transition-opacity hover:opacity-80"
          style={{ color: '#F5F1E8' }}
        >
          {t.nav.brand}
        </Link>

        {/* Desktop nav pill */}
        <div
          className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 rounded-full px-2 py-1.5"
          style={{
            backgroundColor: 'rgba(10,13,20,0.85)',
            border: '1px solid rgba(255,255,255,0.09)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {t.nav.items.map((item, i) => (
            <Link
              key={item}
              to={NAV_PATHS[i]}
              className="text-sm px-4 py-1.5 rounded-full transition-all duration-200 hover:bg-white/8"
              style={{ 
                color: location.pathname === NAV_PATHS[i] ? '#F5F1E8' : 'rgba(245,241,232,0.7)',
                backgroundColor: location.pathname === NAV_PATHS[i] ? 'rgba(255,255,255,0.08)' : 'transparent',
              }}
            >
              {item}
            </Link>
          ))}
        </div>

        {/* Desktop right: lang + CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          <LangToggle />
          <Link
            to="/login"
            className="text-sm font-medium px-4 py-2 rounded-full transition-all duration-200"
            style={{ color: '#B8BDC7', border: '1px solid rgba(255,255,255,0.13)' }}
          >
            {t.nav.signIn}
          </Link>
          <Link
            to="/signup"
            className="text-sm font-medium px-5 py-2 rounded-full transition-all duration-200 hover:opacity-85 active:scale-[0.98]"
            style={{ backgroundColor: '#F5F1E8', color: '#0A0D14' }}
          >
            {t.nav.requestAccess}
          </Link>
        </div>

        {/* Mobile: lang + hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <LangToggle compact />
          <HamburgerButton open={open} onClick={() => setOpen((v) => !v)} />
        </div>
      </nav>

      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
