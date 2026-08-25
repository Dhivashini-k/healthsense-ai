import React from 'react';
import { C } from '../../utils/constants';

export function Card({ children, className = "", style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border ${className} ${onClick ? "cursor-pointer transition-transform hover:-translate-y-0.5" : ""}`}
      style={{
        backgroundColor: C.card,
        borderColor: C.border,
        boxShadow: "0 1px 2px rgba(15,40,30,0.04)",
        ...style
      }}
    >
      {children}
    </div>
  );
}
