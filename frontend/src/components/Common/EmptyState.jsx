import React from 'react';
import { C } from '../../utils/constants';

export function EmptyState({ text }) {
  return <div className="text-center py-10 text-sm" style={{ color: C.textFaint }}>{text}</div>;
}
