import React, { useState } from 'react';
import { HeartPulse, ChevronRight, Stethoscope, Droplets, Brain, Activity, ShieldCheck } from 'lucide-react';
import { Button } from '../Common/Button';
import { C, ROLES, ROLE_DISEASES } from '../../utils/constants';

export function LoginScreen({ onLogin }) {
  const [role, setRole] = useState(null);
  const [name, setName] = useState("");
  
  const getIcon = (r) => {
    switch(r) {
      case 'Nurse': return Stethoscope;
      case 'Endocrinologist': return Droplets;
      case 'Cardiologist': return HeartPulse;
      case 'Neurologist': return Brain;
      case 'Nephrologist': return Activity;
      case 'Super Admin': return ShieldCheck;
      default: return Stethoscope;
    }
  };

  return (
    <div className="w-full min-h-full flex items-center justify-center p-6" style={{ backgroundColor: C.primaryDeep, minHeight: 720, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            <HeartPulse size={16} style={{ color: C.accent }} />
            <span className="text-xs font-semibold tracking-wide text-white/80">HOSPITAL NCD SCREENING NETWORK</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2">HealthSense <span style={{ color: C.accent }}>AI</span></h1>
          <p className="text-white/60 text-sm">Early detection. Automatic referral. One shared record from screening to signature.</p>
        </div>

        <div className="rounded-3xl p-6 md:p-8" style={{ backgroundColor: C.card }}>
          <div className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: C.textFaint }}>Select your portal</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {ROLES.map((r) => {
              const Icon = getIcon(r);
              const active = role === r;
              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className="text-left p-4 rounded-2xl border transition-all"
                  style={{
                    borderColor: active ? C.primary : C.border,
                    backgroundColor: active ? C.primaryLight : "#fff",
                  }}
                >
                  <Icon size={20} style={{ color: active ? C.primary : C.textMuted }} />
                  <div className="mt-2 text-sm font-bold" style={{ color: C.text }}>{r}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.textFaint }}>
                    {r === "Nurse" ? "Screening desk" : r === "Super Admin" ? "Platform control" : `${ROLE_DISEASES[r]?.join(" & ") || ""} referrals`}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (e.g. Dr. Anitha Rao)"
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 md:flex-1"
              style={{ borderColor: C.border, "--tw-ring-color": C.accent }}
            />
            <Button
              disabled={!role}
              onClick={() => onLogin(role, name || role)}
              className="justify-center md:w-48"
            >
              Sign in <ChevronRight size={16} />
            </Button>
          </div>
          <p className="text-xs mt-4" style={{ color: C.textFaint }}>
            Demo authentication — pick any portal to preview that role's workflow.
          </p>
        </div>
      </div>
    </div>
  );
}
