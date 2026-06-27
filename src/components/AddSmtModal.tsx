import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { SmtMember } from '../types';
import { parseCurrencyToNumber } from '../utils/csvParser';
import { synth } from '../utils/audio';

interface AddSmtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newMember: SmtMember) => void;
}

export function AddSmtModal({ isOpen, onClose, onAdd }: AddSmtModalProps) {
  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [salesInput, setSalesInput] = useState('');
  const [checklist, setChecklist] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nip || !nama) {
      alert('NIP dan Nama SMT wajib diisi!');
      return;
    }

    if (!/^\d{5,8}$/.test(nip)) {
      alert('NIP SMT harus berupa angka (5 - 8 digit)!');
      return;
    }

    const rawSales = parseCurrencyToNumber(salesInput);
    synth.playClick();

    onAdd({
      nip,
      nama: nama.toUpperCase().trim(),
      salesToday: rawSales,
      checklistIntime: checklist,
      isUnlocked: rawSales >= 18000000,
      isManualOverride: true,
      lastUpdated: new Date().toISOString()
    });

    // Reset fields
    setNama('');
    setNip('');
    setSalesInput('');
    setChecklist(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden bg-slate-950 border-4 border-black rounded-lg neo-brutalism-shadow-lg text-white">
        
        {/* Header with Informa Brand Color */}
        <div className="bg-[#FFD100] p-5 text-black flex items-center justify-between border-b-4 border-black">
          <h3 className="font-black text-lg tracking-wider uppercase flex items-center gap-1.5">
            <UserPlus className="h-5 w-5 stroke-[3px]" />
            TAMBAH SMT BARU
          </h3>
          <button 
            onClick={onClose}
            className="text-black hover:bg-black/10 rounded p-1 transition cursor-pointer"
          >
            <X className="h-6 w-6 stroke-[3px]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-black text-[#FFD100] uppercase tracking-widest mb-1.5">
              Nama Lengkap SMT
            </label>
            <input
              type="text"
              required
              className="w-full rounded-sm border-2 border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-bold text-white focus:border-[#FFD100] outline-none"
              placeholder="CONTOH: ALDIAN SYAHPUTRA"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#FFD100] uppercase tracking-widest mb-1.5">
              Nomor Induk Pegawai (NIP)
            </label>
            <input
              type="text"
              required
              maxLength={8}
              className="w-full rounded-sm border-2 border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-mono font-bold text-white focus:border-[#FFD100] outline-none"
              placeholder="CONTOH: 183728"
              value={nip}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9]/g, '');
                setNip(cleaned);
              }}
            />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">NIP harus berupa angka unik (5 - 8 digit).</p>
          </div>

          <div>
            <label className="block text-xs font-black text-[#FFD100] uppercase tracking-widest mb-1.5">
              Penjualan Awal Hari Ini (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm font-black text-slate-400">Rp</span>
              <input
                type="text"
                className="w-full rounded-sm border-2 border-slate-700 bg-slate-900 pl-10 pr-3 py-2.5 text-base font-mono font-black text-white focus:border-[#FFD100] outline-none"
                placeholder="0"
                value={salesInput}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '');
                  setSalesInput(cleaned);
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-900 rounded-sm border-2 border-slate-800">
            <div>
              <label htmlFor="add-checklist" className="text-xs font-black text-white cursor-pointer block select-none uppercase tracking-wider">
                SMT Hadir Tepat Waktu (Checklist Intime)
              </label>
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">CENTANG JIKA SMT DATANG TEPAT WAKTU.</p>
            </div>
            <input
              id="add-checklist"
              type="checkbox"
              className="h-5 w-5 rounded border-slate-700 text-[#FFD100] focus:ring-0 cursor-pointer"
              checked={checklist}
              onChange={(e) => setChecklist(e.target.checked)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t-2 border-slate-850">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-black text-slate-350 bg-slate-900 hover:bg-slate-800 rounded-sm border-2 border-slate-700 transition cursor-pointer uppercase tracking-wider"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-black bg-[#FFD100] text-black hover:bg-yellow-400 rounded-sm border-2 border-black neo-brutalism-shadow transition cursor-pointer uppercase tracking-wider"
            >
              Tambah SMT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
