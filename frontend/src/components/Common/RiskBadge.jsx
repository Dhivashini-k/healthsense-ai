import React from 'react';
import { Badge } from './Badge';
import { riskColor, riskBg } from '../../utils/helpers';

export function RiskBadge({ level }) {
  const cls = level === "High" ? "text-brand-high bg-brand-high-bg border-brand-high/30" : level === "Moderate" ? "text-brand-moderate bg-brand-moderate-bg border-brand-moderate/30" : "text-brand-low bg-brand-low-bg border-brand-low/30";
  return <Badge className={cls}>{level}</Badge>;
}
