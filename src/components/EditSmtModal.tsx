import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, ShieldCheck, Milestone } from 'lucide-react';
import { SmtMember } from '../types';
import { formatRupiah, parseCurrencyToNumber } from '../utils/csvParser';
import { synth } from '../utils/audio';

interface EditSmtModalProps {
  member: SmtMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: SmtMember) => void;
  onDelete?: (nip: string) => void;
}

export function EditSmtModal({ member, isOpen, onClose, onSave, onDelete }: EditSmtModalProps) {
  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [salesInput, setSalesInput] = useState('');
  const [checklist, setChecklist] = useState(false);

  useEffect(() => {
    if (member) {
      setNama(member.nama);
      setNip(member.nip);
      setSalesInput(member.salesToday.toString());
      setChecklist(member.checklistIntime);
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const rawSales = parseCurrencyToNumber(salesInput);
    
    // Play celebratory sound if they newly cross the 18M threshold
    const becameUnlocked = !member.isUnlocked && rawSales >= 18000000;
    if (becameUnlocked) {
      synth.playSuccess();
    } else {
      synth.playClick();
    }

    onSave({
      ...member,
      nama,
      nip,
      salesToday: rawSales,
      checklistIntime: checklist,
      isUnlocked: rawSales >= 18000000,
      isManualOverride: true,
      lastUpdated: new Date().toISOString(),
    });
    onClose();
  };

  const handleDeleteClick = () => {
    if (onDelete && confirm(`Hapus SMT ${member.nama} dari list tantangan hari ini?`)) {
      synth.playLock();
      onDelete(member.nip);
      onClose();
    }
  };

  const currentSalesValue = parseCurrencyToNumber(salesInput);
  const targetPercent = Math.min(Math.round((currentSalesValue / 18000000) * 100), 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden bg-slate-950 border-4 border-black rounded-lg neo-brutalism-shadow-lg text-white">
        
        {/* Header with Informa Brand Color */}
        <div className="bg-[#FFD100] p-5 text-black flex items-center justify-between border-b-4 border-black">
          <div>
            <h3 className="font-black text-lg tracking-wider uppercase flex items-center gap-1.5">
              <Milestone className="h-5 w-5 stroke-[3px]" />
              Detail & Edit SMT
            </h3>
            <p className="text-xs font-bold uppercase tracking-wider text-black/70 mt-0.5">NIP: {member.nip}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-black hover:bg-black/10 rounded p-1 transition cursor-pointer"
          >
            <X className="h-6 w-6 stroke-[3px]" />
          </button>
        </div>

        {/* Goal Banner */}
        <div className={`px-5 py-3.5 flex items-center justify-between text-xs font-black uppercase tracking-widest border-b-2 border-black ${
          currentSalesValue >= 18000000 
            ? 'bg-emerald-500 text-black' 
            : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                currentSalesValue >= 18000000 ? 'bg-black' : 'bg-white'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                currentSalesValue >= 18000000 ? 'bg-emerald-950' : 'bg-red-950'
              }`}></span>
            </span>
            <span className="italic">
              {currentSalesValue >= 18000000 
                ? 'BOLEH PULANG SEKARANG! 🏃‍♂️💨' 
                : 'MASIH BERJUANG! BELUM BOLEH 🔒'}
            </span>
          </div>
          <span className="font-mono text-sm tracking-tighter">{targetPercent}% Goal</span>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-black text-[#FFD100] uppercase tracking-widest mb-1.5">
              Nama Lengkap SMT
            </label>
            <input
              type="text"
              required
              className="w-full rounded-sm border-2 border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-white focus:border-[#FFD100] outline-none"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Nomor Induk Pegawai (NIP)
            </label>
            <input
              type="text"
              required
              disabled
              className="w-full rounded-sm border-2 border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-500 font-mono font-bold cursor-not-allowed outline-none"
              value={nip}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#FFD100] uppercase tracking-widest mb-1.5 flex justify-between">
              <span>Penjualan Hari Ini (Sales Today)</span>
              <span className="font-mono text-white tracking-tighter">{formatRupiah(currentSalesValue)}</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm font-black text-slate-400">Rp</span>
              <input
                type="text"
                required
                className="w-full rounded-sm border-2 border-slate-700 bg-slate-900 pl-10 pr-3 py-2.5 text-base font-mono font-black text-white focus:border-[#FFD100] outline-none"
                placeholder="0"
                value={salesInput}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '');
                  setSalesInput(cleaned);
                }}
              />
            </div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Masukkan nominal tanpa titik atau koma.</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-900 rounded-sm border-2 border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <div>
                <label htmlFor="checklist" className="text-xs font-black text-white cursor-pointer block select-none uppercase tracking-wider">
                  Checklist Intime SMT
                </label>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">SMT HADIR TEPAT WAKTU HARI INI.</p>
              </div>
            </div>
            <input
              id="checklist"
              type="checkbox"
              className="h-5 w-5 rounded border-slate-700 text-[#FFD100] focus:ring-0 cursor-pointer"
              checked={checklist}
              onChange={(e) => setChecklist(e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t-2 border-slate-850">
            {onDelete ? (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="px-3 py-2 text-xs font-black text-red-500 hover:bg-red-950/40 rounded-sm flex items-center gap-1.5 cursor-pointer uppercase tracking-wider border border-transparent hover:border-red-800 transition"
              >
                <Trash2 className="h-4 w-4" />
                Hapus SMT
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-black text-slate-350 bg-slate-900 hover:bg-slate-800 rounded-sm border-2 border-slate-700 transition cursor-pointer uppercase tracking-wider"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-black bg-[#FFD100] text-black hover:bg-yellow-400 rounded-sm border-2 border-black neo-brutalism-shadow transition cursor-pointer uppercase tracking-wider"
              >
                Simpan Update
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
