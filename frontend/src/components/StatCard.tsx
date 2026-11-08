import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  icon: ReactNode;
  tone?: 'violet' | 'cyan' | 'emerald' | 'amber';
}

const toneStyles = {
  violet: 'bg-violet-500/10 text-violet-200',
  cyan: 'bg-cyan-500/10 text-cyan-200',
  emerald: 'bg-emerald-500/10 text-emerald-200',
  amber: 'bg-amber-500/10 text-amber-200',
};

export function StatCard({ label, value, trend, icon, tone = 'violet' }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111a33] p-5 shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:border-violet-500/30">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <div className={`rounded-full p-2 ${toneStyles[tone]}`}>{icon}</div>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <h4 className="text-3xl font-semibold text-white">{value}</h4>
        {trend && <span className="text-sm text-emerald-400">{trend}</span>}
      </div>
    </div>
  );
}
