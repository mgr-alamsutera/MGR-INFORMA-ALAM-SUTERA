import React, { useState } from 'react';
import { Clipboard, Check, RefreshCw, HelpCircle, X, ArrowRight } from 'lucide-react';
import { SmtMember } from '../types';
import { parsePastedSalesData, formatRupiah } from '../utils/csvParser';
import { synth } from '../utils/audio';

interface CopasPanelProps {
  existingMembers: SmtMember[];
  onUpdateMembers: (newMembers: SmtMember[]) => void;
  onClose: () => void;
}

export function CopasPanel({ existingMembers, onUpdateMembers, onClose }: CopasPanelProps) {
  const [pasteText, setPasteText] = useState('');
  const [previewList, setPreviewList] = useState<{
    member: SmtMember;
    oldSales: number;
    newSales: number;
    statusChanged: boolean;
  }[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [hasParsed, setHasParsed] = useState(false);

  const handleParse = () => {
    synth.playClick();
    if (!pasteText.trim()) {
      alert('Pasted text is empty. Please copy-paste data from Sheets/Excel first!');
      return;
    }

    const { updatedMembers, logs: parsedLogs } = parsePastedSalesData(pasteText, existingMembers);
    
    // Build a preview of changes
    const changes: typeof previewList = [];
    
    updatedMembers.forEach(newM => {
      const oldM = existingMembers.find(m => m.nip === newM.nip);
      if (oldM) {
        if (oldM.salesToday !== newM.salesToday || oldM.checklistIntime !== newM.checklistIntime) {
          changes.push({
            member: newM,
            oldSales: oldM.salesToday,
            newSales: newM.salesToday,
            statusChanged: !oldM.isUnlocked && newM.isUnlocked,
          });
        }
      } else {
        // New SMT entirely
        changes.push({
          member: newM,
          oldSales: 0,
          newSales: newM.salesToday,
          statusChanged: newM.isUnlocked,
        });
      }
    });

    setPreviewList(changes);
    setLogs(parsedLogs);
    setHasParsed(true);
  };

  const handleApply = () => {
    if (previewList.length === 0) {
      onClose();
      return;
    }

    // Re-run parser to merge changes properly
    const { updatedMembers } = parsePastedSalesData(pasteText, existingMembers);
    
    // Check if anyone newly unlocked 18M to play fanfare!
    const newlyUnlocked = previewList.some(c => c.statusChanged);
    if (newlyUnlocked) {
      synth.playSuccess();
    } else {
      synth.playClick();
    }

    onUpdateMembers(updatedMembers);
    onClose();
  };

  return (
    <div className="rounded-lg border-2 border-white/15 bg-slate-900 p-6 shadow-2xl text-white">
      <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-4">
        <div>
          <h3 className="text-xl font-black text-[#FFD100] flex items-center gap-2 uppercase tracking-wide">
            <Clipboard className="h-6 w-6 stroke-[2.5px]" />
            COPAS IMPORTER
          </h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            TARIK SEMUA DATA DARI EXCEL ATAU GOOGLE SHEET DALAM SEKALI KLIK.
          </p>
        </div>
        <button 
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {!hasParsed ? (
        <div className="space-y-4">
          <div className="rounded-sm bg-yellow-950/30 border-2 border-yellow-800/45 p-4 text-xs text-[#FFD100] space-y-2">
            <div className="flex items-center gap-1.5 font-black uppercase tracking-wider">
              <HelpCircle className="h-4 w-4 flex-shrink-0 text-[#FFD100]" />
              PETUNJUK PENYALINAN DATA:
            </div>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 font-bold text-slate-300 uppercase tracking-wide text-[11px]">
              <li>BUKA FILE GOOGLE SHEETS / EXCEL ANDA.</li>
              <li>BLOK ATAU SELEKSI BARIS DATA DI SHEET <span className="font-black text-white">UNDERTAKER / COPAS</span>.</li>
              <li>TEKAN <kbd className="px-1 py-0.5 bg-black border border-slate-700 rounded text-white">Ctrl+C</kbd> (COPY) PADA KEYBOARD ANDA.</li>
              <li>KLIK AREA TEXT DI BAWAH & TEKAN <kbd className="px-1 py-0.5 bg-black border border-slate-700 rounded text-white">Ctrl+V</kbd> (PASTE).</li>
            </ol>
          </div>

          <div>
            <textarea
              className="w-full h-44 rounded-sm border-2 border-slate-700 bg-slate-950 p-3 text-xs font-mono font-bold text-white focus:border-[#FFD100] outline-none"
              placeholder="Paste data tabel spreadsheet di sini... Contoh:&#10;195142&#9;GANIS MAHARDIKA&#9;2,142,703&#9;FALSE&#10;177535&#9;NUR LISTIANA&#9;1,160,360&#9;FALSE"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-black text-slate-350 bg-slate-900 hover:bg-slate-800 rounded-sm border-2 border-slate-700 transition cursor-pointer uppercase tracking-wider"
            >
              Batal
            </button>
            <button
              onClick={handleParse}
              disabled={!pasteText.trim()}
              className="px-5 py-2.5 text-xs font-black bg-[#FFD100] text-black hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm border-2 border-black neo-brutalism-shadow transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
            >
              <RefreshCw className="h-4 w-4 stroke-[2.5px]" />
              PROSES DATA COPAS
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="text-sm font-black text-[#FFD100] flex items-center gap-1.5 uppercase tracking-wider">
            <Check className="h-5 w-5 text-emerald-400 stroke-[3px]" />
            HASIL ANALISIS ({previewList.length} PERUBAHAN DATA)
          </h4>

          {previewList.length === 0 ? (
            <div className="rounded-sm bg-slate-950 p-8 text-center text-xs text-slate-400 border-2 border-slate-800 uppercase tracking-widest font-black">
              TIDAK ADA PERUBAHAN DATA SALES DENGAN DATA SAAT INI.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto border-2 border-slate-800 rounded-sm divide-y divide-slate-800 text-xs bg-slate-950">
              {previewList.map((change, idx) => (
                <div key={idx} className="p-3.5 hover:bg-slate-900/60 transition flex items-center justify-between">
                  <div>
                    <div className="font-black text-white uppercase text-sm tracking-tight">{change.member.nama}</div>
                    <div className="text-slate-500 font-bold text-[10px] uppercase font-mono">NIP: {change.member.nip}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-slate-500 line-through text-[10px] font-mono">{formatRupiah(change.oldSales)}</div>
                      <div className="font-mono font-black text-[#FFD100] text-sm">{formatRupiah(change.newSales)}</div>
                    </div>
                    {change.statusChanged ? (
                      <span className="px-2 py-1 rounded bg-emerald-500 text-black font-black text-[9px] animate-pulse uppercase tracking-wider">
                        SIAP PULANG 🏃‍♂️
                      </span>
                    ) : change.member.isUnlocked ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[9px] uppercase tracking-wider border border-emerald-500/30">
                        Siap Pulang
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-red-600/20 text-red-400 font-bold text-[9px] uppercase tracking-wider border border-red-600/30">
                        Masih Berjuang
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Diagnostic Log */}
          <details className="text-left bg-slate-950 rounded-sm border-2 border-slate-800">
            <summary className="px-3.5 py-2.5 text-[11px] font-black text-slate-300 uppercase tracking-widest cursor-pointer hover:bg-slate-900 transition select-none">
              LIHAT SISTEM PARSING LOGS ({logs.length} BARIS)
            </summary>
            <div className="p-3 border-t-2 border-slate-800 font-mono text-[10px] max-h-36 overflow-y-auto text-slate-400 space-y-1.5 bg-slate-950">
              {logs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
            </div>
          </details>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => {
                synth.playClick();
                setHasParsed(false);
                setPreviewList([]);
              }}
              className="px-3.5 py-2 text-xs font-black text-[#FFD100] bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 rounded-sm uppercase tracking-wider cursor-pointer"
            >
              UBAH DATA COPAS
            </button>
            <div className="flex gap-2.5">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-black text-slate-350 bg-slate-900 hover:bg-slate-800 rounded-sm border-2 border-slate-700 transition cursor-pointer uppercase tracking-wider"
              >
                Batal
              </button>
              <button
                onClick={handleApply}
                className="px-5 py-2.5 text-xs font-black bg-[#FFD100] text-black hover:bg-yellow-400 rounded-sm border-2 border-black neo-brutalism-shadow transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
              >
                TERAPKAN & UPDATE
                <ArrowRight className="h-4 w-4 stroke-[2.5px]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
