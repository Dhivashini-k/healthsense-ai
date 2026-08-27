import React, { useState } from 'react';
import { HeartPulse, ChevronRight, Stethoscope, Droplets, Brain, Activity, ShieldCheck, Mail, Lock } from 'lucide-react';
import { Button } from '../Common/Button';
import { C, ROLES, ROLE_DISEASES } from '../../utils/constants';
import { authAPI } from '../../services/api';

const DEMO_CREDENTIALS = {
  "Nurse": { email: "nurse@healthsense.demo", pass: "Nurse@123", name: "Nurse Rukmini" },
  "Endocrinologist": { email: "diabetes@healthsense.demo", pass: "Diabetes@123", name: "Dr. Krishna" },
  "Cardiologist": { email: "cardiology@healthsense.demo", pass: "Cardio@123", name: "Dr. Lakshman" },
  "Neurologist": { email: "stroke@healthsense.demo", pass: "Stroke@123", name: "Dr. Keshav" },
  "Nephrologist": { email: "ckd@healthsense.demo", pass: "CKD@123", name: "Dr. Radha" },
  "Super Admin": { email: "admin@healthsense.demo", pass: "Admin@123", name: "HealthSense Admin" }
};

const DISPLAY_ROLES = ["Nurse", "Endocrinologist", "Cardiologist", "Neurologist", "Nephrologist", "Super Admin"];

export function LoginScreen({ onLogin }) {
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const getIcon = (r) => {
    if (r.includes('Nurse')) return Stethoscope;
    if (r.includes('Endo')) return Droplets;
    if (r.includes('Cardio')) return HeartPulse;
    if (r.includes('Neuro')) return Brain;
    if (r.includes('Nephro')) return Activity;
    if (r.includes('Admin')) return ShieldCheck;
    return Stethoscope;
  };

  const handleRoleSelect = (r) => {
    setRole(r);
    setError("");
    const creds = DEMO_CREDENTIALS[r];
    if (creds) {
      setEmail(creds.email);
      setPassword(creds.pass);
    }
  };

  const handleLogin = async () => {
    if (!role) return;
    const creds = DEMO_CREDENTIALS[role];
    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      const user = response.data.user;
      localStorage.setItem('healthsense_token', response.data.access_token);
      const roleMap = { nurse: 'Nurse', endocrinologist: 'Endocrinologist', cardiologist: 'Cardiologist', neurologist: 'Neurologist', nephrologist: 'Nephrologist', super_admin: 'Super Admin' };
      onLogin(roleMap[user.role] || role, user.name || creds?.name || role);
    } catch (requestError) {
      if (requestError.response) setError(requestError.response.data?.detail || 'Those demo credentials were not accepted.');
      else onLogin(role, creds?.name || role);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen w-full min-h-screen flex items-center justify-center p-4 sm:p-6 bg-brand-deepGreen font-sans">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 bg-white/10">
            <HeartPulse size={16} className="text-brand-accent" />
            <span className="text-xs font-semibold tracking-wide text-white/80">HOSPITAL NCD SCREENING NETWORK</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2">HealthSense <span className="text-brand-accent">AI</span></h1>
          <p className="text-white/60 text-sm">Early detection. Automatic referral. One shared record from screening to signature.</p>
        </div>

        <div className="rounded-3xl p-6 md:p-8 bg-brand-card">
          <div className="text-xs font-semibold mb-3 uppercase tracking-wide flex items-center justify-between text-brand-faint">
            <span>Select your portal</span>
            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200">DEMO ACCOUNT</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {DISPLAY_ROLES.map((r) => {
              const Icon = getIcon(r);
              const active = role === r;
              return (
                <button
                  key={r}
                  onClick={() => handleRoleSelect(r)}
                  className={`text-left p-4 rounded-2xl border transition-all hover:border-emerald-300 ${active ? 'border-brand-primary bg-brand-primary-light' : 'border-brand-border bg-white'}`}
                >
                  <Icon size={20} className={active ? "text-brand-primary" : "text-brand-muted"} />
                  <div className="mt-2 text-sm font-bold text-brand-text">{r}</div>
                  <div className="text-xs mt-0.5 text-brand-faint">
                    {r === "Nurse" ? "Screening desk" : r === "Super Admin" ? "Operations overview" : "Specialist reviews"}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={email}
                    readOnly
                    placeholder="Select a role to auto-fill"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm bg-white text-slate-600 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={password}
                    readOnly
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm bg-white text-slate-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              disabled={!role || loading}
              onClick={handleLogin}
              className="justify-center w-full md:w-64 py-3"
            >
              {loading ? 'Connecting...' : 'Sign In'} <ChevronRight size={16} />
            </Button>
          </div>
          {error && <p role="alert" className="text-sm text-red-600 mt-3 text-right">{error}</p>}
        </div>
      </div>
    </div>
  );
}
