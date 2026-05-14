'use client';

import { TrendingUp, ChevronDown, X } from 'lucide-react';
import Gauge from './Gauge';
import { useLang } from '@/i18n';

export default function DashboardPreview() {
  const { t } = useLang();
  const d = t.landing.dashboard;

  return (
    <div className="px-3 sm:px-4 w-full">
      <div className="bg-[#111522]/80 backdrop-blur-md rounded-3xl p-4 sm:p-6 w-full max-w-[880px] mx-auto border border-white/5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          
          {/* Card 1 — Active Projects */}
          <div className="bg-[#171C2A] rounded-2xl p-5 flex flex-col gap-4 border border-white/5 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-[#ef4d23] text-[13px] font-semibold">{d.activeProjects.title}</h4>
                <p className="text-fog text-[12px]">{d.activeProjects.period}</p>
              </div>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-semibold text-ivory">{d.activeProjects.value}</span>
              <div className="bg-sage/10 text-sage rounded-full px-2 py-0.5 flex items-center gap-1 text-[11px] font-medium">
                <TrendingUp size={12} />
                {d.activeProjects.change}
              </div>
            </div>
            
            <p className="text-[11px] text-fog -mt-2">{d.activeProjects.caption}</p>
            
            <div className="flex flex-col items-center gap-2 py-2">
              <p className="text-[12px] font-medium text-silver">{d.activeProjects.label}</p>
              <Gauge value={92} showLabels min={d.activeProjects.min} max={d.activeProjects.max} />
            </div>

            <div className="bg-obsidian rounded-full p-1 flex mt-auto">
              <button className="flex-1 text-[11px] font-semibold py-1.5 rounded-full bg-dusk text-ivory shadow-sm">{d.activeProjects.tasks}</button>
              <button className="flex-1 text-[11px] font-semibold py-1.5 rounded-full text-fog">{d.activeProjects.title}</button>
            </div>
          </div>

          {/* Card 2 — Form */}
          <div className="bg-[#171C2A] rounded-2xl p-5 flex flex-col gap-3 border border-white/5 shadow-xl">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-silver">{d.form.showFigures}</label>
              <button className="w-full flex items-center justify-between bg-obsidian border border-white/10 rounded-lg px-3 py-2 text-[13px] text-ivory hover:bg-white/5 transition-colors">
                {d.form.thisMonth}
                <ChevronDown size={16} className="text-fog" />
              </button>
            </div>
 
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-silver">{d.form.comparePeriod}</label>
              <button className="w-full flex items-center justify-between bg-obsidian border border-white/10 rounded-lg px-3 py-2 text-[13px] text-ivory hover:bg-white/5 transition-colors">
                {d.form.mtd}
                <ChevronDown size={16} className="text-fog" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-silver">{d.form.setTargetsMonth}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fog text-[13px]">#</span>
                <input 
                  type="text" 
                  defaultValue="10"
                  className="w-full bg-obsidian border-white/10 rounded-lg h-10 pl-7 pr-3 text-[13px] text-ivory focus:ring-1 focus:ring-[#ef4d23] outline-none"
                />
              </div>
            </div>
 
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-silver">{d.form.setTargetsYear}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fog text-[13px]">#</span>
                <input 
                  type="text" 
                  defaultValue="100"
                  className="w-full bg-obsidian border-white/10 rounded-lg h-10 pl-7 pr-3 text-[13px] text-ivory focus:ring-1 focus:ring-[#ef4d23] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-auto pt-2">
              <button className="bg-[#ef4d23] text-white text-[13px] font-semibold px-5 py-2 rounded-lg hover:brightness-110 transition-all">
                {d.form.save}
              </button>
              <button className="text-[13px] text-fog font-medium underline underline-offset-4 hover:text-ivory">
                {d.form.cancel}
              </button>
              <button className="ml-auto text-fog hover:text-ivory">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Card 3 — Approvals */}
          <div className="bg-[#171C2A] rounded-2xl p-5 flex flex-col gap-4 border border-white/5 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-[#ef4d23] text-[13px] font-semibold">{d.approvals.title}</h4>
                <p className="text-fog text-[12px]">{d.approvals.period}</p>
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-semibold text-ivory">{d.approvals.value}</span>
              <div className="bg-obsidian text-fog rounded-full px-2 py-0.5 flex items-center gap-1 text-[11px] font-medium">
                <TrendingUp size={12} />
                {d.approvals.change}
              </div>
            </div>

            <p className="text-[11px] text-fog -mt-2">{d.approvals.caption}</p>

            <div className="flex flex-col items-center gap-2 py-2">
              <Gauge value={68} color="#ef4d23" />
            </div>

            <div className="bg-obsidian rounded-full p-1 flex mt-auto">
              <button className="flex-1 text-[11px] font-semibold py-1.5 rounded-full bg-dusk text-ivory shadow-sm">{d.approvals.resolved}</button>
              <button className="flex-1 text-[11px] font-semibold py-1.5 rounded-full text-fog">{d.approvals.title}</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
