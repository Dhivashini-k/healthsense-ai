import React from 'react';
import { C } from '../../utils/constants';

export function Field({ label, children, className = "" }) {
  return (
    <label className={`block mb-4 ${className}`}>
      <div className="text-xs font-bold mb-1.5 uppercase tracking-wider text-brand-muted">{label}</div>
      {children}
    </label>
  );
}
