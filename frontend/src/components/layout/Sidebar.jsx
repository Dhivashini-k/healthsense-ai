import React from 'react';
import { LayoutDashboard, Users, ClipboardList, FileText, FlaskConical, Stethoscope, ClipboardCheck } from 'lucide-react';
import { HeartPulse } from 'lucide-react';
import { C } from '../../utils/constants';
import { NavItem } from './NavItem';

export function Sidebar({ role, tab, setTab }) {
  let items = [];
  if (role === "Nurse") {
    items = [
      ["dashboard", "Dashboard", LayoutDashboard],
      ["patients", "Patients", Users],
      ["screening", "New Screening", ClipboardList],
      ["archive", "Risk Report Archive", FileText],
      ["labs", "Lab Tests", FlaskConical],
    ];
  } else if (role === "Super Admin") {
    items = [
      ["dashboard", "Global Analytics", LayoutDashboard],
      ["users", "Manage Users", Users],
      ["specialists", "Manage Specialists", Stethoscope],
      ["reports", "Manage Reports", FileText],
    ];
  } else {
    items = [
      ["dashboard", "Dashboard", LayoutDashboard],
      ["referrals", "Referrals", ClipboardCheck],
      ["labs", "Lab Tests", FlaskConical],
    ];
  }
  
  return (
    <aside className="w-64 shrink-0 p-4 flex flex-col gap-1" style={{ backgroundColor: C.primaryDeep }}>
      <div className="flex items-center gap-2 px-2 py-3 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.accent }}>
          <HeartPulse size={18} className="text-white" />
        </div>
        <div>
          <div className="text-white font-extrabold text-sm leading-none">HealthSense</div>
          <div className="text-white/50 text-[11px] mt-0.5">AI Screening Platform</div>
        </div>
      </div>
      {items.map(([key, label, Icon]) => (
        <NavItem key={key} icon={Icon} label={label} active={tab === key} onClick={() => setTab(key)} />
      ))}
      <div className="mt-auto pt-4 px-3 text-[11px] text-white/30">v1.0 · Hospital Edition</div>
    </aside>
  );
}
