import React from 'react';

export function Badge({ children, color, bg, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border ${className}`}
    >
      {children}
    </span>
  );
}
