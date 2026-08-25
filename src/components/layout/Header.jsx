import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Search, Bell, ShieldCheck, Stethoscope, UserCheck, Activity, Award, LogOut, ChevronDown } from "lucide-react";

export default function Header() {
  const { searchQuery, setSearchQuery, notifications, userRole, setUserRole, user, logoutUser } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const ROLES = [
    { key: "nurse", label: "Nurse", icon: UserCheck },
    { key: "endocrinologist", label: "Endocrinologist", icon: Stethoscope },
    { key: "cardiologist", label: "Cardiologist", icon: Stethoscope },
    { key: "neurologist", label: "Neurologist", icon: Stethoscope },
    { key: "nephrologist", label: "Nephrologist", icon: Stethoscope },
    { key: "super_admin", label: "Super Admin", icon: ShieldCheck }
  ];

  const getGreeting = () => {
    if (user?.name) {
      return `Welcome, ${user.name}`;
    }

    switch (userRole) {
      case "nurse": return "Welcome, Nurse Sarah Jenkins 🩺";
      case "endocrinologist": return "Welcome back, Dr. Arjun Mehta (Endocrinologist) 🩺";
      case "cardiologist": return "Welcome back, Dr. Rajesh Gupta (Cardiologist) ❤️";
      case "neurologist": return "Welcome back, Dr. Robert Chen (Neurologist) 🧠";
      case "nephrologist": return "Welcome back, Dr. Alistair Vance (Nephrologist) 🩺";
      case "super_admin": return "Welcome, Hospital Super Administrator 👑";
      default: return "Welcome to HealthSense AI";
    }
  };

  return (
    <header className="bg-slate-50 px-8 py-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200/60">
      {/* Left: Role Greeting */}
      <div>
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
          {getGreeting()}
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          {userRole === "nurse"
            ? "Nurse Screening Station • Perform patient registrations & AI clinical assessments."
            : userRole === "super_admin"
            ? "Super Admin Portal • Global hospital analytics, specialist routing & management."
            : "Specialist Care Unit • Review high-risk referrals, select lab tests & sign reports."}
        </p>
      </div>

      {/* Right: Search, 6-Role Switcher, Notifications & Profile */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative w-56 hidden md:block">
          <input
            type="text"
            placeholder="Search patient, ID, report..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 text-xs bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs text-slate-700"
          />
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
        </div>

        {/* 6 Role Switcher Pills */}
        <div className="flex items-center bg-white p-1 rounded-full border border-slate-200 text-[11px] font-bold shadow-2xs overflow-x-auto max-w-full">
          {ROLES.map((r) => {
            const isSelected = userRole === r.key;
            return (
              <button
                key={r.key}
                onClick={() => setUserRole(r.key)}
                className={`px-2.5 py-1 rounded-full transition whitespace-nowrap ${
                  isSelected ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Bell Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-100 transition relative text-slate-600 shadow-2xs"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
              {notifications.length}
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-900">Hospital Notifications ({notifications.length})</h4>
              <div className="text-xs space-y-2 max-h-60 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-slate-900">{n.title}</p>
                    <p className="text-slate-600 mt-0.5">{n.text}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 px-3.5 py-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 transition shadow-2xs"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-[#033B2C] flex items-center justify-center font-bold text-xs uppercase">
              {user?.name?.charAt(0) || "H"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900">{user?.name || "HealthSense User"}</p>
              <p className="text-[10px] text-slate-500">{(userRole || "nurse").replace("_", " ")}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-xl border border-slate-200 z-50 p-4 text-slate-900">
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Signed in as</p>
                <p className="font-bold text-slate-900">{user?.name || "HealthSense User"}</p>
                <p className="text-[11px] text-slate-500">{user?.email || "n/a"}</p>
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-2xl">
                  <ShieldCheck className="w-3.5 h-3.5" /> {userRole.replace("_", " ")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowProfile(false);
                  logoutUser();
                }}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
