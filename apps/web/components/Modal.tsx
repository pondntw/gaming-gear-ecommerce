'use client';

import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="my-8 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgb(0_0_0/0.2)] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <button onClick={onClose} aria-label="ปิด" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-muted hover:text-ink">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
