import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  colorClass: string;
  accentBg: string;
  delay?: number;
}

export function StatCard({ title, value, subValue, icon: Icon, colorClass, accentBg, delay = 0 }: StatCardProps) {
  // Map standard colors to high-impact bold theme accents
  let outlineColor = 'border-white/15';
  let badgeColor = 'bg-[#FFD100] text-black';
  let titleColor = 'text-[#FFD100]';

  if (title.includes('PULANG') || accentBg.includes('emerald') || accentBg.includes('green')) {
    outlineColor = 'border-emerald-500/35';
    badgeColor = 'bg-emerald-500 text-black';
    titleColor = 'text-emerald-400';
  } else if (title.includes('BERJUANG') || accentBg.includes('rose') || accentBg.includes('red')) {
    outlineColor = 'border-rose-500/35';
    badgeColor = 'bg-rose-600 text-white';
    titleColor = 'text-rose-400';
  } else if (title.includes('JUALAN') || accentBg.includes('amber')) {
    outlineColor = 'border-amber-500/35';
    badgeColor = 'bg-[#FFD100] text-black';
    titleColor = 'text-[#FFD100]';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`relative overflow-hidden bg-slate-900 text-white border-2 ${outlineColor} p-5 shadow-2xl rounded-lg neo-brutalism-shadow`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className={`text-xs font-black uppercase tracking-widest ${titleColor}`}>{title}</p>
          <p className="text-3xl font-black tracking-tight text-white tabular-nums truncate">{value}</p>
          {subValue && <p className="text-xs text-slate-400 font-medium truncate">{subValue}</p>}
        </div>
        <div className={`rounded-md p-3 font-bold ${badgeColor} shrink-0 border-2 border-black shadow-sm`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      
      {/* Heavy bottom highlight tape */}
      <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${
        titleColor.includes('emerald') 
          ? 'bg-emerald-500' 
          : titleColor.includes('rose') 
            ? 'bg-rose-600' 
            : 'bg-[#FFD100]'
      }`} />
    </motion.div>
  );
}
