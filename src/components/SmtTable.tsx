import React, { useState } from 'react';
import { 
  Search, ArrowUpDown, Edit2, 
  CheckSquare, Square, Trophy, Award, Sparkles, Check, Lock
} from 'lucide-react';
import { SmtMember } from '../types';
import { formatRupiah } from '../utils/csvParser';
import { synth } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';

interface SmtTableProps {
  members: SmtMember[];
  onSelectMember: (member: SmtMember) => void;
  onToggleChecklist: (nip: string) => void;
  onAddSalesQuickly: (nip: string, amount: number) => void;
}

type FilterType = 'ALL' | 'UNLOCKED' | 'LOCKED' | 'CHECKLIST' | 'OVERRIDE';
type SortType = 'SALES_DESC' | 'SALES_ASC' | 'NAME_ASC' | 'GOAL_DESC';

export function SmtTable({ members, onSelectMember, onToggleChecklist, onAddSalesQuickly }: SmtTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [sortBy, setSortBy] = useState<SortType>('SALES_DESC');

  // Filter members
  const filteredMembers = members.filter(m => {
    // Search matching
    const matchesSearch = 
      m.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.nip.includes(searchQuery);

    if (!matchesSearch) return false;

    // Type matching
    switch (filterType) {
      case 'UNLOCKED':
        return m.isUnlocked;
      case 'LOCKED':
        return !m.isUnlocked;
      case 'CHECKLIST':
        return m.checklistIntime;
      case 'OVERRIDE':
        return !!m.isManualOverride;
      case 'ALL':
      default:
        return true;
    }
  });

  // Sort members
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    switch (sortBy) {
      case 'SALES_ASC':
        return a.salesToday - b.salesToday;
      case 'NAME_ASC':
        return a.nama.localeCompare(b.nama);
      case 'GOAL_DESC':
        const aPercent = Math.min((a.salesToday / 18000000) * 100, 100);
        const bPercent = Math.min((b.salesToday / 18000000) * 100, 100);
        return bPercent - aPercent;
      case 'SALES_DESC':
      default:
        return b.salesToday - a.salesToday;
    }
  });

  const getFilterBadgeClass = (type: FilterType) => {
    if (filterType === type) {
      return 'bg-[#FFD100] text-black font-black border-2 border-black neo-brutalism-shadow';
    }
    return 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10';
  };

  const targetLimit = 18000000;

  return (
    <div className="space-y-4 text-white">
      {/* Search, Filter, Sort Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-5 rounded-lg border-2 border-white/10 shadow-2xl">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-md border-2 border-slate-700 outline-none focus:border-[#FFD100] focus:ring-0 transition bg-slate-950 text-white font-bold"
            placeholder="CARI SMT BERDASARKAN NAMA / NIP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Sort Selection */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 border-2 border-slate-700 rounded-md px-3 py-2 text-xs font-black text-[#FFD100] uppercase tracking-wider">
            <ArrowUpDown className="h-4 w-4" />
            <select
              className="bg-transparent border-none outline-none font-black cursor-pointer uppercase text-[11px] tracking-wide"
              value={sortBy}
              onChange={(e) => {
                synth.playClick();
                setSortBy(e.target.value as SortType);
              }}
            >
              <option className="bg-slate-900 text-white" value="SALES_DESC">Sales: Tertinggi</option>
              <option className="bg-slate-900 text-white" value="SALES_ASC">Sales: Terendah</option>
              <option className="bg-slate-900 text-white" value="GOAL_DESC">% Target Terdekat</option>
              <option className="bg-slate-900 text-white" value="NAME_ASC">Nama (A-Z)</option>
            </select>
          </div>
        </div>

      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-1">
        <button
          onClick={() => { synth.playClick(); setFilterType('ALL'); }}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest cursor-pointer transition rounded-sm ${getFilterBadgeClass('ALL')}`}
        >
          SEMUA SMT ({members.length})
        </button>
        <button
          onClick={() => { synth.playClick(); setFilterType('UNLOCKED'); }}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest cursor-pointer transition rounded-sm ${getFilterBadgeClass('UNLOCKED')}`}
        >
          SIAP PULANG 🏃‍♂️ ({members.filter(m => m.isUnlocked).length})
        </button>
        <button
          onClick={() => { synth.playClick(); setFilterType('LOCKED'); }}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest cursor-pointer transition rounded-sm ${getFilterBadgeClass('LOCKED')}`}
        >
          MASIH BERJUANG 🔒 ({members.filter(m => !m.isUnlocked).length})
        </button>
        <button
          onClick={() => { synth.playClick(); setFilterType('CHECKLIST'); }}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest cursor-pointer transition rounded-sm ${getFilterBadgeClass('CHECKLIST')}`}
        >
          CHECKLIST ({members.filter(m => m.checklistIntime).length})
        </button>
        <button
          onClick={() => { synth.playClick(); setFilterType('OVERRIDE'); }}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest cursor-pointer transition rounded-sm ${getFilterBadgeClass('OVERRIDE')}`}
        >
          MANUAL ({members.filter(m => m.isManualOverride).length})
        </button>
      </div>

      {/* Main Leaderboard Table & Cards */}
      {sortedMembers.length === 0 ? (
        <div className="bg-slate-900 rounded-lg border-2 border-white/10 p-12 text-center shadow-2xl">
          <p className="text-sm text-slate-400 font-black uppercase tracking-widest">Tidak ada SMT yang cocok dengan filter atau pencarian.</p>
          <button 
            onClick={() => { setSearchQuery(''); setFilterType('ALL'); }}
            className="mt-3 text-xs font-black text-[#FFD100] hover:underline uppercase tracking-wider"
          >
            Reset Pencarian & Filter
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Table Headers for Desktop */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 mb-1 text-[11px] font-black uppercase tracking-widest text-slate-500 select-none">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-4">Sales Consultant Name / NIP</div>
            <div className="col-span-3 text-right">Current Sales Today</div>
            <div className="col-span-2 text-center">Progress Target</div>
            <div className="col-span-1 text-center">Checklist</div>
            <div className="col-span-1 text-right">Aksi</div>
          </div>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {sortedMembers.map((member, index) => {
                const targetPercent = Math.min((member.salesToday / targetLimit) * 100, 100);
                const isWinner = member.isUnlocked;

                // Alternate styling for Unlocked vs Locked
                const rowClass = isWinner
                  ? 'bg-emerald-500 text-black border-l-8 border-emerald-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.35)]'
                  : 'bg-slate-900 text-white border-l-8 border-red-600 border-y border-r border-white/5 shadow-xl';

                const displayRank = (index + 1).toString().padStart(2, '0');

                return (
                  <motion.div
                    key={member.nip}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center px-6 py-4.5 rounded-sm transition-all border border-black ${rowClass}`}
                  >
                    
                    {/* RANK / TROPHY */}
                    <div className="col-span-1 flex items-center justify-between md:justify-center">
                      <div className="flex items-center gap-3 md:gap-0">
                        <div className={`font-black text-2xl italic tracking-tighter ${isWinner ? 'text-black' : 'text-[#FFD100]'}`}>
                          {displayRank}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 md:hidden ml-2">RANK</span>
                      </div>

                      {/* Status Badge for Mobile */}
                      <div className="md:hidden">
                        {isWinner ? (
                          <span className="bg-black text-emerald-400 border border-emerald-400 px-3 py-1 text-[10px] font-black italic rounded-sm uppercase tracking-wider">
                            SIAP PULANG 🏃‍♂️
                          </span>
                        ) : (
                          <span className="border-2 border-red-600 text-red-600 px-3 py-1 text-[10px] font-black italic rounded-sm uppercase tracking-wider bg-black/40">
                            BELUM BOLEH 🔒
                          </span>
                        )}
                      </div>
                    </div>

                    {/* SMT NAME & NIP */}
                    <div className="col-span-4 space-y-1">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className={`font-black uppercase tracking-tight text-lg md:text-xl ${isWinner ? 'text-black' : 'text-white'}`}>
                          {member.nama}
                        </span>
                        {member.isManualOverride && (
                          <span className={`text-[9px] px-1 py-0.2 rounded font-black uppercase tracking-wide border ${
                            isWinner ? 'bg-black text-emerald-400 border-black' : 'bg-red-950 text-red-400 border-red-800'
                          }`}>
                            MANUAL
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono font-bold opacity-80">
                        <span>NIP: <span className={isWinner ? 'text-black font-black' : 'text-[#FFD100]'}>{member.nip}</span></span>
                      </div>
                    </div>

                    {/* TOTAL SALES */}
                    <div className="col-span-3 flex justify-between md:block md:text-right">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 md:hidden">CURRENT SALES</span>
                      <div className="space-y-0.5 text-right">
                        <div className={`font-black text-xl md:text-2xl font-mono tracking-tight tabular-nums ${isWinner ? 'text-black' : 'text-red-500'}`}>
                          {formatRupiah(member.salesToday)}
                        </div>
                        {!isWinner && (
                          <div className="text-[10px] font-bold text-slate-400">
                            Kurang: <span className="font-mono text-red-500 font-bold">{formatRupiah(Math.max(targetLimit - member.salesToday, 0))}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PROGRESS BAR */}
                    <div className="col-span-2 space-y-1.5 px-0 md:px-4">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-80">
                        <span className="md:hidden">Progress</span>
                        <span>{targetPercent.toFixed(0)}% GOAL</span>
                      </div>
                      <div className={`h-4.5 w-full rounded-sm overflow-hidden border ${isWinner ? 'bg-emerald-950/20 border-black' : 'bg-slate-950 border-slate-800'}`}>
                        <motion.div 
                          className={`h-full ${isWinner ? 'bg-black' : 'bg-red-600'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${targetPercent}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    {/* CHECKLIST */}
                    <div className="col-span-1 flex justify-between md:justify-center items-center">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 md:hidden">Checklist Intime</span>
                      <button
                        onClick={() => {
                          synth.playClick();
                          onToggleChecklist(member.nip);
                        }}
                        className={`p-1.5 rounded border-2 transition-all cursor-pointer ${
                          member.checklistIntime 
                            ? isWinner 
                              ? 'bg-black border-black text-emerald-400 hover:opacity-90' 
                              : 'bg-emerald-500 border-black text-black hover:bg-emerald-400' 
                            : isWinner 
                              ? 'border-black text-black/40 hover:text-black' 
                              : 'border-slate-700 bg-slate-950 text-slate-500 hover:border-white/30 hover:text-white'
                        }`}
                        title={member.checklistIntime ? 'Hapus Checklist' : 'Tandai Checklist'}
                      >
                        {member.checklistIntime ? (
                          <CheckSquare className="h-5.5 w-5.5 font-bold" />
                        ) : (
                          <Square className="h-5.5 w-5.5" />
                        )}
                      </button>
                    </div>

                    {/* ACTIONS: QUICK ADD & EDIT */}
                    <div className="col-span-1 flex items-center justify-between md:justify-end gap-2 border-t border-black/10 md:border-t-0 pt-3 md:pt-0">
                      
                      {/* Quick Add Buttons */}
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => onAddSalesQuickly(member.nip, 1000000)}
                          className={`px-2 py-1 text-[10px] font-black border uppercase tracking-wider rounded-sm cursor-pointer hover:scale-105 active:scale-95 transition-all ${
                            isWinner 
                              ? 'bg-black text-white border-black' 
                              : 'bg-[#FFD100] text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          }`}
                          title="Tambah +1jt"
                        >
                          +1Jt
                        </button>
                        <button
                          onClick={() => onAddSalesQuickly(member.nip, 5000000)}
                          className={`px-2 py-1 text-[10px] font-black border uppercase tracking-wider rounded-sm cursor-pointer hover:scale-105 active:scale-95 transition-all ${
                            isWinner 
                              ? 'bg-black text-white border-black' 
                              : 'bg-red-600 text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          }`}
                          title="Tambah +5jt"
                        >
                          +5Jt
                        </button>
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          synth.playClick();
                          onSelectMember(member);
                        }}
                        className={`p-2 rounded border-2 transition-all cursor-pointer shadow-sm hover:scale-105 ${
                          isWinner 
                            ? 'bg-black border-black text-emerald-400' 
                            : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-white'
                        }`}
                        title="Edit Detail SMT"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
