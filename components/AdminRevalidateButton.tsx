'use client';

import { useState } from 'react';
import { triggerRevalidate } from '@/lib/revalidate-client';

interface AdminRevalidateButtonProps {
  className?: string;
  targetPath?: string;
  label?: string;
  variant?: 'sidebar' | 'header' | 'card';
}

export default function AdminRevalidateButton({
  className = '',
  targetPath = 'all',
  label = 'Yayını Güncelle',
  variant = 'sidebar',
}: AdminRevalidateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleRevalidate = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    const res = await triggerRevalidate(targetPath);

    setLoading(false);
    if (res.success) {
      setStatus('success');
      setMessage(res.message);
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 3500);
    } else {
      setStatus('error');
      setMessage(res.message);
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 4000);
    }
  };

  if (variant === 'card') {
    return (
      <div className={`p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between ${className}`}>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xl">⚡</span>
            <h3 className="font-bold text-slate-900 text-sm">Canlı Yayın & Önbellek</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Yeni ürün, kategori veya blog yazısı eklediğinizde sitenin en güncel halini anında yayına almak için önbelleği tazeleyin.
          </p>
        </div>

        {message && (
          <div
            role="status"
            className={`mb-3 p-2.5 rounded-xl text-xs font-semibold ${
              status === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={handleRevalidate}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
        >
          <span className={loading ? 'animate-spin' : ''}>{loading ? '↻' : '⚡'}</span>
          <span>{loading ? 'Yenileniyor...' : 'Tüm Siteyi Anında Güncelle'}</span>
        </button>
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <div className="relative inline-block">
        <button
          type="button"
          onClick={handleRevalidate}
          disabled={loading}
          title="Yeni eklenen veya düzenlenen içerikleri anında canlıya yansıtır"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
            status === 'success'
              ? 'bg-emerald-500 text-white border-emerald-600'
              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
          } ${className}`}
        >
          <span className={loading ? 'animate-spin' : ''}>{loading ? '↻' : status === 'success' ? '✓' : '⚡'}</span>
          <span>{loading ? 'Tazeleniyor...' : status === 'success' ? 'Güncellendi!' : label}</span>
        </button>
      </div>
    );
  }

  // Varsayılan: Sidebar düğmesi
  return (
    <div className={`space-y-1 ${className}`}>
      <button
        type="button"
        onClick={handleRevalidate}
        disabled={loading}
        title="Yeni eklenen veya düzenlenen içerikleri anında canlıya yansıtır"
        className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
          status === 'success'
            ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-700/50'
            : status === 'error'
            ? 'bg-red-950/40 text-red-300 border border-red-700/50'
            : 'bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white border border-slate-800'
        }`}
      >
        <span className="flex items-center gap-2.5">
          <span className={`text-sm ${loading ? 'animate-spin' : ''}`}>{loading ? '↻' : status === 'success' ? '✓' : '⚡'}</span>
          <span>{loading ? 'Yenileniyor...' : status === 'success' ? 'Site Güncellendi!' : label}</span>
        </span>
        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Canlı</span>
      </button>

      {message && status === 'error' && (
        <p className="text-[10px] text-red-400 px-2 font-medium">{message}</p>
      )}
    </div>
  );
}
