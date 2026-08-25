import React from 'react';
import { X } from 'lucide-react';
import { C } from '../../utils/constants';

export function Modal({ title, onClose, children, wide }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,25,20,0.45)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${wide ? "max-w-4xl" : "max-w-lg"} max-h-[88vh] overflow-y-auto rounded-2xl`}
        style={{ backgroundColor: C.card }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
          style={{ borderColor: C.border, backgroundColor: C.card }}
        >
          <h3 className="font-bold text-lg" style={{ color: C.text }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={18} style={{ color: C.textMuted }} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
