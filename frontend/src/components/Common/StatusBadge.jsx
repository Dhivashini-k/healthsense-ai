import React from 'react';
import { Badge } from './Badge';
import { C } from '../../utils/constants';

export function StatusBadge({ status }) {
  const map = {
    Draft: "text-brand-moderate bg-brand-moderate-bg border-brand-moderate/30",
    Viewed: "text-blue-600 bg-blue-50 border-blue-600/30",
    Signed: "text-brand-low bg-brand-low-bg border-brand-low/30",
    Archived: "text-brand-muted bg-slate-100 border-slate-200"
  };
  const cls = map[status] || "text-brand-muted bg-slate-100 border-slate-200";
  return <Badge className={cls}>{status}</Badge>;
}
