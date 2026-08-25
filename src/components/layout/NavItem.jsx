import React from 'react';

export function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
      style={{
        backgroundColor: active ? "rgba(255,255,255,0.14)" : "transparent",
        color: active ? "#fff" : "rgba(255,255,255,0.6)"
      }}
    >
      <Icon size={17} /> {label}
    </button>
  );
}
