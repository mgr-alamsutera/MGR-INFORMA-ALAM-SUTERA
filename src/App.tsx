import React, { useState, useEffect } from 'react';
import { 
  DEFAULT_SMT_ROSTER 
} from './data/defaultSmt';
import { SmtMember, AppStats, SyncHistory } from './types';
import { parseGoogleSheetsCsv, calculateStats, formatRupiah } from './utils/csvParser';
import { synth } from './utils/audio';
import { StatCard } from './components/StatCard';
import { SmtTable } from './components/SmtTable';
import { 
  RefreshCw, Database, 
  Check, Volume2, VolumeX, Sparkles, Flame, Moon, Award, 
  ExternalLink, Clock, ShoppingBag
} from 'lucide-react';

// Hardcoded default Sheet URL
const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1VfrvbgSJyfjWopiUA2EgTffAfsjdZhrAUoS0rT2_bUo/export?format=csv';

export default function App() {
  // SMT List State (initialized from localStorage or default roster)
  const [members, setMembers] = useState<SmtMember[]>(() => {
    const saved = localStorage.getItem('smt_members');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error reading localStorage members', e);
      }
    }
    return DEFAULT_SMT_ROSTER;
  });

  // Spreadsheet URL configuration
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    return localStorage.getItem('smt_sheet_url') || DEFAULT_SHEET_URL;
  });

  // UI state managers
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>(() => {
    const saved = localStorage.getItem('smt_sync_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Save SMT data to localStorage on change
  useEffect(() => {
    localStorage.setItem('smt_members', JSON.stringify(members));
  }, [members]);

  // Save sheet URL to localStorage
  useEffect(() => {
    localStorage.setItem('smt_sheet_url', sheetUrl);
  }, [sheetUrl]);

  // Save sync history to localStorage
  useEffect(() => {
    localStorage.setItem('smt_sync_history', JSON.stringify(syncHistory));
  }, [syncHistory]);

  // Clock runner
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch spreadsheet data automatically on mount (graceful background fetch)
  useEffect(() => {
    handleSync();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    synth.playClick();
    
    try {
      // Fetch public CSV with a cache-buster to always get fresh data
      const fetchUrl = `${sheetUrl}&t=${Date.now()}`;
      const response = await fetch(fetchUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      const parsedMembers = parseGoogleSheetsCsv(csvText);
      
      if (parsedMembers.length === 0) {
        throw new Error('Sistem gagal membaca baris data di Google Sheet. Periksa format kolom.');
      }

      // Update members state directly from Sheets (no manual merging)
      setMembers(parsedMembers);
      
      // Log success
      const newHistory: SyncHistory = {
        timestamp: new Date().toISOString(),
        status: 'success',
        message: 'Sinkronisasi berhasil dengan Google Sheets.',
        recordCount: parsedMembers.length
      };
      setSyncHistory(prev => [newHistory, ...prev].slice(0, 5));

      if (soundEnabled) {
        // Slight celebrate sound for sync completion
        synth.playSuccess();
      }

    } catch (error: any) {
      console.error('Failed to sync spreadsheet', error);
      const newHistory: SyncHistory = {
        timestamp: new Date().toISOString(),
        status: 'error',
        message: error?.message || 'Gagal menghubungi Google Sheets. Silakan cek koneksi internet.',
        recordCount: 0
      };
      setSyncHistory(prev => [newHistory, ...prev].slice(0, 5));
    } finally {
      setIsSyncing(false);
    }
  };

  // Quick sound generator button (fanfare)
  const triggerBuzzer = () => {
    synth.playSuccess();
  };

  // Calculations for Stats
  const stats = calculateStats(members);

  // Time formatter
  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Ticker marquee message block
  const marqueeMessage = `*** SMT UNDERTAKER INFORMA LIVING WORLD ALAM SUTERA *** TANTANGAN PENJUALAN Rp 18.000.000 HARI INI LANGSUNG PULANG *** SIAP PULANG: ${stats.unlockedCount} SMT *** MASIH BERJUANG: ${stats.lockedCount} SMT *** TOTAL PENJUALAN HARI INI: ${formatRupiah(stats.totalSales)} *** SALAM SATU SPIRIT INFORMA FURNITURE *** `;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-[#FFD100] selection:text-black pb-24">
      
      {/* 1. BRUTALIST BRANDING NAVBAR */}
      <header className="bg-[#FFD100] text-black border-b-4 border-black sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Informa Brutalist Logo & Header Text */}
          <div className="flex items-center gap-4">
            {/* Hard-hitting Solid Block logo */}
            <div className="bg-black text-[#FFD100] px-4 py-2.5 border-2 border-black font-black text-center shadow-[3px_3px_0px_0px_rgba(255,255,255,0.4)] select-none">
              <span className="text-2xl font-black tracking-tighter uppercase italic">informa</span>
              <div className="text-[8px] font-black tracking-widest mt-0.5 uppercase">LIVING WORLD</div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="bg-black text-[#FFD100] font-black text-[9px] px-2 py-0.5 rounded-sm tracking-widest uppercase">
                  STORE CHALLENGE
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-black/80">
                  ALAM SUTERA HUB
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black italic">
                SMT UNDERTAKER BOARD
              </h1>
            </div>
          </div>

          {/* Clock & Sound Control Box */}
          <div className="flex flex-wrap items-center gap-3 bg-black text-white p-3 border-2 border-black rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)]">
            
            {/* Live Clock */}
            <div className="text-right border-r border-slate-800 pr-3 flex items-center gap-2.5">
              <Clock className="h-5 w-5 text-[#FFD100] animate-pulse shrink-0" />
              <div className="leading-none text-left">
                <div className="font-mono text-base font-black tracking-wider text-[#FFD100]">{formattedTime}</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{formattedDate}</div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const nextState = !soundEnabled;
                  setSoundEnabled(nextState);
                  if (nextState) {
                    synth.playClick();
                  }
                }}
                className={`p-2 rounded-sm border-2 transition-all cursor-pointer ${
                  soundEnabled 
                    ? 'bg-[#FFD100] border-black text-black hover:bg-yellow-400' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title={soundEnabled ? "Matikan Suara" : "Aktifkan Suara"}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4 stroke-[2.5px]" /> : <VolumeX className="h-4 w-4 stroke-[2.5px]" />}
              </button>

              <button
                onClick={triggerBuzzer}
                className="px-3 py-1.5 rounded-sm bg-emerald-500 hover:bg-emerald-400 text-black border-2 border-black font-black text-[10px] flex items-center gap-1.5 cursor-pointer uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-[1px] transition-all"
                title="Mainkan Suara Perayaan SMT"
              >
                <Sparkles className="h-3.5 w-3.5" />
                BUZZER 🎉
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* 2. STATS OVERVIEW SECTION */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="TOTAL SMT TERLIBAT"
            value={stats.totalSmt}
            subValue="KONSULTAN AKTIF"
            icon={Flame}
            colorClass="border-white/10"
            accentBg="bg-amber-500"
            delay={0.05}
          />
          <StatCard
            title="SIAP PULANG 🏃‍♂️💨"
            value={`${stats.unlockedCount} SMT`}
            subValue={`${stats.unlockedPercentage}% TARGET TERCAPAI`}
            icon={Check}
            colorClass="border-emerald-500/30"
            accentBg="bg-emerald-500"
            delay={0.1}
          />
          <StatCard
            title="MASIH BERJUANG 🔒"
            value={`${stats.lockedCount} SMT`}
            subValue="PENJUALAN DI BAWAH 18JT"
            icon={Moon}
            colorClass="border-rose-500/30"
            accentBg="bg-rose-600"
            delay={0.15}
          />
          <StatCard
            title="TOTAL SALES HARI INI"
            value={formatRupiah(stats.totalSales)}
            subValue={`Rata-rata: ${formatRupiah(stats.averageSales)}`}
            icon={ShoppingBag}
            colorClass="border-yellow-500/30"
            accentBg="bg-yellow-500"
            delay={0.2}
          />
        </div>
      </section>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: LEADERBOARD TABLE & HERO BANNER (8 Cols) */}
          <section className="lg:col-span-8 space-y-5">
            
            {/* HERO MOTIVATION BANNER */}
            <div className="relative overflow-hidden bg-red-600 border-4 border-black p-5 text-white neo-brutalism-shadow rounded-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center text-2xl shadow-md border-2 border-white shrink-0">
                  🔥
                </div>
                <div>
                  <h4 className="font-black text-lg md:text-xl text-[#FFD100] tracking-wider uppercase italic">
                    CHALLENGE JUALAN 18JT SEKARANG!
                  </h4>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/95 mt-1">
                    SIAPAPUN YANG BISA TEMBUS SALES Rp 18.000.000 HARI INI BOLEH LANGSUNG PULANG! SMT LAIN JANGAN MAU KALAH!
                  </p>
                </div>
              </div>

              {/* Live progress indicator bar */}
              <div className="bg-black/95 text-[#FFD100] border-2 border-black p-3 rounded-sm flex items-center gap-3 shrink-0 shadow-inner">
                <span className="text-xs font-black uppercase tracking-wider font-mono">
                  {stats.unlockedCount} / {stats.totalSmt} BEBAS
                </span>
                <div className="w-16 h-3.5 bg-slate-850 rounded-sm overflow-hidden border border-slate-700">
                  <div 
                    className="h-full bg-emerald-500"
                    style={{ width: `${stats.unlockedPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* SMT TABLE LIST */}
            <SmtTable members={members} />

          </section>

          {/* RIGHT COLUMN: GOOGLE SHEETS LIVE SYNC PANEL (4 Cols) */}
          <section className="lg:col-span-4 space-y-6">
            
            {/* GOOGLE SHEETS LIVE SYNC PANEL */}
            <div className="bg-slate-900 rounded-lg border-2 border-white/10 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-800">
                <h3 className="text-xs font-black text-[#FFD100] uppercase tracking-widest flex items-center gap-1.5">
                  <Database className="h-4.5 w-4.5 text-emerald-400 stroke-[2.5px]" />
                  GOOGLE SHEETS SYNC
                </h3>
                {isSyncing && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    SPREADSHEET CSV LINK SOURCE
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      className="flex-1 bg-slate-950 border-2 border-slate-800 rounded-sm px-3 py-2 text-[10px] text-slate-300 font-mono font-bold focus:border-[#FFD100] outline-none"
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      title="Google Sheets CSV Export URL"
                    />
                    <a
                      href="https://docs.google.com/spreadsheets/d/1VfrvbgSJyfjWopiUA2EgTffAfsjdZhrAUoS0rT2_bUo/edit?usp=sharing"
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-slate-950 hover:bg-slate-900 border-2 border-slate-850 text-[#FFD100] rounded-sm transition cursor-pointer"
                      title="Buka Sheets di Tab Baru"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {/* Sync Action Button */}
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-sm border-2 border-black neo-brutalism-shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`h-4.5 w-4.5 stroke-[3px] ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Sinkronisasi...' : 'Tarik Data Google Sheet'}
                </button>

                {/* Sync History Logs */}
                <div className="space-y-2">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Log Sinkronisasi Terakhir
                  </div>
                  {syncHistory.length === 0 ? (
                    <div className="text-[10px] text-slate-500 italic bg-slate-950 p-3 rounded-sm text-center border-2 border-dashed border-slate-800 uppercase font-bold tracking-wider">
                      Belum ada aktivitas sinkronisasi.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-0.5">
                      {syncHistory.map((hist, i) => (
                        <div 
                           key={i} 
                           className={`p-2.5 rounded-sm border-2 text-[10px] flex items-start gap-2 ${
                            hist.status === 'success' 
                              ? 'bg-slate-950/40 border-emerald-500/30 text-slate-300' 
                              : 'bg-slate-950/40 border-rose-500/30 text-rose-400'
                          }`}
                        >
                          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${hist.status === 'success' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          <div className="flex-1">
                            <div className="font-bold flex justify-between items-center text-[9px] text-slate-500 uppercase tracking-wider">
                              <span>{hist.status === 'success' ? 'SUKSES' : 'GAGAL'}</span>
                              <span>{new Date(hist.timestamp).toLocaleTimeString('id-ID')}</span>
                            </div>
                            <div className="mt-0.5 font-bold leading-normal text-white uppercase text-[10px]">{hist.message}</div>
                            {hist.recordCount > 0 && (
                              <div className="text-[9px] text-emerald-400 font-black uppercase tracking-wider mt-0.5">{hist.recordCount} SMT BERHASIL DIMUAT.</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* INFORMA SERVICE VALUE BANNER */}
            <div className="bg-[#FFD100] text-black rounded-sm p-5 border-4 border-black neo-brutalism-shadow relative overflow-hidden">
              <h4 className="text-xs font-black tracking-widest uppercase flex items-center gap-1 italic">
                <Award className="h-4.5 w-4.5 stroke-[2.5px]" />
                SERVICE VALUES INFORMA
              </h4>
              <p className="text-xs mt-2 leading-relaxed font-black italic uppercase tracking-tight text-black/90">
                "We provide style and comfort beyond expectations. Let's conquer the day with high spirit!"
              </p>
              <div className="text-[9px] font-black tracking-widest text-black/60 mt-3 uppercase">
                Living World Alam Sutera SMT Team
              </div>
            </div>

          </section>

        </div>
      </main>

      {/* BRUTALIST RUNNING MOTIVATION MARQUEE TAPE */}
      <footer className="fixed bottom-0 left-0 right-0 h-11 bg-black border-t-2 border-[#FFD100] overflow-hidden flex items-center z-20">
        <div className="relative w-full flex items-center overflow-hidden">
          <div className="animate-marquee whitespace-nowrap text-[#FFD100] font-black text-xs uppercase tracking-widest select-none flex">
            <span>{marqueeMessage}</span>
            <span>{marqueeMessage}</span>
            <span>{marqueeMessage}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
