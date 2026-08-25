import React from 'react';
import { Badge } from './Badge';
import { C } from '../../utils/constants';

export function StatusBadge({ status }) {
  const map = {
    Draft: [C.moderate, C.moderateBg],
    Viewed: ["#2563EB", "#E7EEFD"],
    Signed: [C.low, C.lowBg],
    Archived: [C.textMuted, "#EEF2F1"]
  };
  const [color, bg] = map[status] || [C.textMuted, "#EEF2F1"];
  return <Badge color={color} bg={bg}>{status}</Badge>;
}
