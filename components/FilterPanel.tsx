'use client';

import { Brand } from '@/lib/supabase';

interface FilterPanelProps {
  brands: Brand[];
  selectedBrand: string;
  setSelectedBrand: (value: string) => void;
  selectedPin: string;
  setSelectedPin: (value: string) => void;
}

export default function FilterPanel({
  brands,
  selectedBrand,
  setSelectedBrand,
  selectedPin,
  setSelectedPin
}: FilterPanelProps) {
  const pinOptions = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];

  return (
    <div className="w-full bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-5">
      
      {/* Araç / Marka Filtresi */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 select-none">ARAÇ SEÇ</h4>
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="w-full border border-gray-200 rounded-xl p-3 text-xs bg-gray-50 focus:border-blue-400 outline-none font-semibold cursor-pointer transition-colors"
        >
          <option value="">Tüm Araçlar</option>
          {brands.map((b) => (
            <option key={b.id} value={b.name}>{b.name.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Pin Sayısı Filtresi */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 select-none">PİN SAYISI</h4>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setSelectedPin('')}
            className={`px-2 py-2 text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
              !selectedPin 
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/10' 
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Tümü
          </button>
          {pinOptions.map((pin) => (
            <button
              key={pin}
              onClick={() => setSelectedPin(String(pin))}
              className={`px-2 py-2 text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                selectedPin === String(pin) 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/10' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {pin} PIN
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}