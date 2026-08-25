import React from 'react';

export function Badge({ children, color, bg, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}
      style={{ color: color || "#0E7C5A", backgroundColor: bg || "#E7F4EE" }}
    >
      {children}
    </span>
  );
}
