'use client';
import { useLang } from '@/i18n';
import { cn } from '@/lib/utils';

const TAG_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  // EN tags
  Feature:    { bg: 'rgba(26,31,50,0.8)',    color: '#8AB0D4', border: 'rgba(138,176,212,0.25)' },
  Major:      { bg: 'rgba(184,155,106,0.1)',  color: '#B89B6A', border: 'rgba(184,155,106,0.25)' },
  Security:   { bg: 'rgba(168,106,106,0.1)',  color: '#A86A6A', border: 'rgba(168,106,106,0.25)' },
  Fix:        { bg: 'rgba(184,189,199,0.08)', color: '#B8BDC7', border: 'rgba(184,189,199,0.2)' },
  Foundation: { bg: 'rgba(127,163,138,0.1)',  color: '#7FA38A', border: 'rgba(127,163,138,0.25)' },
  // FR tags
  'Fonctionnalité': { bg: 'rgba(26,31,50,0.8)',    color: '#8AB0D4', border: 'rgba(138,176,212,0.25)' },
  'Majeur':         { bg: 'rgba(184,155,106,0.1)',  color: '#B89B6A', border: 'rgba(184,155,106,0.25)' },
  'Securite':       { bg: 'rgba(168,106,106,0.1)',  color: '#A86A6A', border: 'rgba(168,106,106,0.25)' },
  'Fondations':     { bg: 'rgba(127,163,138,0.1)',  color: '#7FA38A', border: 'rgba(127,163,138,0.25)' },
};

function fallbackStyle() {
  return { bg: 'rgba(255,255,255,0.04)', color: '#8A9099', border: 'rgba(255,255,255,0.12)' };
}

export default function Changelog() {
  const { t } = useLang();
  const releases = t.landing.vex.releases;

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-ivory">{t.landing.vex.changelogTitle}</h1>
        <p className="text-sm text-fog mt-1">{t.landing.vex.changelogSub}</p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-[7px] top-2 bottom-2 w-px"
          style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
        />

        <div className="space-y-8">
          {releases.map((release, i) => {
            const style = TAG_STYLES[release.tag] ?? fallbackStyle();

            return (
              <div key={release.version} className={cn('relative pl-8', i === 0 && '')}>
                {/* Dot */}
                <div
                  className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2"
                  style={{
                    backgroundColor: i === 0 ? style.color : '#171C2A',
                    borderColor: i === 0 ? style.color : 'rgba(255,255,255,0.15)',
                  }}
                />

                {/* Card */}
                <div
                  className="rounded-2xl p-5 space-y-4"
                  style={{
                    backgroundColor: '#111522',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  {/* Header row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-semibold font-mono text-ivory">
                      {release.version}
                    </span>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: style.bg,
                        color: style.color,
                        border: `1px solid ${style.border}`,
                      }}
                    >
                      {release.tag}
                    </span>
                    <span className="text-xs text-fog ml-auto">{release.date}</span>
                  </div>

                  {/* Items */}
                  <ul className="space-y-1.5">
                    {release.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-silver">
                        <span className="mt-1.5 h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: style.color }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
