import React from 'react';
import { Card } from './Card';
import { C } from '../../utils/constants';

export function KPICard({ icon: Icon, label, value, sub, color, onClick }) {
  const iconColor = color || C.primary;
  return (
    <Card className="p-5 flex-1 min-w-[210px]" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.textFaint }}>{label}</div>
          <div className="text-3xl font-extrabold mt-2" style={{ color: C.text }}>{value}</div>
          {sub && <div className="text-xs mt-1" style={{ color: C.textMuted }}>{sub}</div>}
        </div>
        <div className="rounded-xl p-2.5" style={{ backgroundColor: iconColor + "1A" }}>
          <Icon size={20} style={{ color: iconColor }} />
        </div>
      </div>
    </Card>
  );
}
