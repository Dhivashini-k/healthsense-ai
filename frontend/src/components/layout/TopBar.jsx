import React, { useState } from 'react';
import { Search, Bell, LogOut, AlertOctagon, X, Check } from 'lucide-react';
import { C, ROLE_DISEASES } from '../../utils/constants';
import { fmtDate } from '../../utils/helpers';

export function TopBar({ session, db, onLogout, setTab, persist }) {
  const [q, setQ] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  
  const matches = q.length > 1 ? db.patients.filter((p) => 
    p.name.toLowerCase().includes(q.toLowerCase())
  ) : [];

  const myDiseases = ROLE_DISEASES[session.role] || [];
  
  const emergencyReferrals = db.referrals.filter((r) => 
    myDiseases.includes(r.disease) && r.riskLevel === "High" && !r.isSeen
  );

  const myNotifs = db.notifications
    .filter((n) => n.role === session.role || (session.role === "Nurse" && n.role === "Nurse"))
    .slice(-15).reverse();
  const unread = myNotifs.filter((n) => !n.read).length;

  const markAllNotifsRead = async () => {
    if (!persist) return;
    const updated = db.notifications.map((n) => (n.role === session.role ? { ...n, read: true } : n));
    const updatedRefs = db.referrals.map((r) => (myDiseases.includes(r.disease) ? { ...r, isSeen: true } : r));
    await persist({ ...db, notifications: updated, referrals: updatedRefs });
  };
  
  return (
    <header className="flex flex-col border-b" style={{ backgroundColor: C.card, borderColor: C.border }}>
      {emergencyReferrals.length > 0 && (
        <div className="bg-red-600 text-white px-6 py-2 flex items-center justify-between text-xs font-extrabold animate-pulse z-40">
          <div className="flex items-center gap-2">
            <AlertOctagon size={18} className="shrink-0 text-yellow-300" />
            <span>
              THIS IS EMERGENCY: {emergencyReferrals.length} High-Risk patient ({emergencyReferrals.map(r => `${db.patients.find(p => p.id === r.patientId)?.name || 'Patient'} - ${r.disease} ${r.riskPercent}%`).join(', ')}) requires immediate review!
            </span>
          </div>
          <button
            onClick={() => setTab("referrals")}
            className="px-3 py-1 bg-white text-red-700 font-extrabold rounded-lg text-xs hover:bg-yellow-100 transition-colors"
          >
            Review Now
          </button>
        </div>
      )}

      <div className="h-16 flex items-center justify-between px-6">
        <div className="relative w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textFaint }} />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setShowResults(true); }}
            placeholder="Search patients by name..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
            style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
          />
          {showResults && q.length > 1 && (
            <div className="absolute top-11 left-0 w-full bg-white rounded-xl border shadow-lg z-30 overflow-hidden" style={{ borderColor: C.border }}>
              {matches.length === 0 && <div className="p-3 text-xs" style={{ color: C.textFaint }}>No patients found</div>}
              {matches.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setTab("patients"); setShowResults(false); setQ(""); }}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 border-b last:border-0"
                  style={{ borderColor: C.border }}
                >
                  <div className="font-semibold" style={{ color: C.text }}>{m.name}</div>
                  <div className="text-xs" style={{ color: C.textFaint }}>{m.age}y · {m.gender} · {m.phone}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 rounded-xl hover:bg-gray-100">
              <Bell size={19} style={{ color: C.textMuted }} />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: C.high }}>
                  {unread}
                </span>
              )}
            </button>
            {showNotif && (
              <div className="absolute right-0 top-11 w-88 bg-white rounded-xl border shadow-lg z-30 overflow-hidden" style={{ borderColor: C.border }}>
                <div className="px-4 py-3 border-b font-bold text-sm flex justify-between items-center" style={{ borderColor: C.border, color: C.text }}>
                  <span>Notifications</span>
                  {unread > 0 && (
                    <button onClick={markAllNotifsRead} className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <Check size={13} /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {myNotifs.length === 0 && <div className="p-4 text-xs" style={{ color: C.textFaint }}>No notifications yet</div>}
                  {myNotifs.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => { setShowNotif(false); if (myDiseases.length) setTab("referrals"); }}
                      className={`px-4 py-3 border-b last:border-0 text-xs cursor-pointer hover:bg-slate-50 ${n.isEmergency ? 'bg-red-50' : ''}`}
                      style={{ borderColor: C.border }}
                    >
                      <div className={`font-semibold ${n.isEmergency ? 'text-red-700' : ''}`} style={{ color: n.isEmergency ? '#D64545' : C.text }}>
                        {n.message}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px]" style={{ color: C.textFaint }}>
                        <span>{fmtDate(n.createdAt)}</span>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 pl-4 border-l" style={{ borderColor: C.border }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
              {session.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="text-sm">
              <div className="font-bold leading-none" style={{ color: C.text }}>{session.name}</div>
              <div className="text-xs mt-0.5" style={{ color: C.textFaint }}>{session.role}</div>
            </div>
            <button onClick={onLogout} className="p-2 rounded-xl hover:bg-gray-100 ml-1">
              <LogOut size={17} style={{ color: C.textMuted }} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
