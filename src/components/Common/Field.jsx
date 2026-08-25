import React from 'react';
import { C } from '../../utils/constants';

export function Field({ label, children }) {
  return (
    <label className="block mb-4">
      <div className="text-xs font-semibold mb-1.5" style={{ color: C.textMuted }}>{label}</div>
      {children}
    </label>
  );
}
