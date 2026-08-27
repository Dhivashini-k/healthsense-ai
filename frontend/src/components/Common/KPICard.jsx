import React from 'react';
import { Card } from './Card';
import { C } from '../../utils/constants';

export function KPICard({ icon: Icon, label, value, sub, color, onClick }) {
  const iconColor = color || C.primary;
  return (
    <Card className="p-5 flex-1 w-full" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-faint">{label}</div>
          <div className="text-3xl font-extrabold mt-2 text-brand-text">{value}</div>
          {sub && <div className="text-xs mt-1 text-brand-muted">{sub}</div>}
        </div>
        <div className={`rounded-xl p-2.5 ${color === C.accent ? 'bg-brand-accent/10 text-brand-accent' : color === C.high ? 'bg-brand-high-bg text-brand-high' : color === C.moderate ? 'bg-brand-moderate-bg text-brand-moderate' : 'bg-brand-primary/10 text-brand-primary'}`}>
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
}
