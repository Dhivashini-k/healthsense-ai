import React from 'react';
import { C } from '../../utils/constants';

export function Button({ children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: { backgroundColor: C.primary, color: "#fff" },
    outline: { backgroundColor: "transparent", color: C.primary, border: `1px solid ${C.primary}` },
    ghost: { backgroundColor: C.primaryLighter, color: C.primaryDark },
    danger: { backgroundColor: C.high, color: "#fff" },
  };
  return (
    <button
      className={`px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50 ${className}`}
      style={styles[variant] || styles.primary}
      {...props}
    >
      {children}
    </button>
  );
}
