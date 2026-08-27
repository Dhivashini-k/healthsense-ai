import React from 'react';
import { X } from 'lucide-react';
import { C } from '../../utils/constants';

export function Modal({ title, onClose, children, wide }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-primary-deep/45 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${wide ? "max-w-4xl" : "max-w-lg"} max-h-[90vh] flex flex-col rounded-2xl modal-solid shadow-2xl relative`}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0"
        >
          <h3 className="font-bold text-lg text-brand-text">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} className="text-brand-muted" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
