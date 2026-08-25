import React from 'react';
import { Badge } from './Badge';
import { riskColor, riskBg } from '../../utils/helpers';

export function RiskBadge({ level }) {
  return <Badge color={riskColor(level)} bg={riskBg(level)}>{level}</Badge>;
}
