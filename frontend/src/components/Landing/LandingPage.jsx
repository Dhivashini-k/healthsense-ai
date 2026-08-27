import React from 'react';
import { Activity, ArrowRight, Brain, HeartPulse, ShieldCheck } from 'lucide-react';

export function LandingPage({ onEnter }) {
  return (
    <div className="landing-page bg-gradient-animate relative overflow-hidden min-h-screen">
      <div className="absolute inset-0 bg-spatial-grid opacity-40 z-0 pointer-events-none"></div>
      
      <header className="landing-nav relative z-10 pt-6">
        <div className="brand-lockup">
          <span className="brand-mark bg-emerald-600"><HeartPulse size={20} /></span>
          <span className="text-xl font-extrabold text-slate-800">HealthSense <b className="text-emerald-500">AI</b></span>
        </div>
        <span className="nav-note bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full shadow-sm border border-emerald-100">
          <ShieldCheck size={16} className="text-emerald-500" /> Built for clinical teams
        </span>
      </header>

      <main className="landing-wrap relative z-10 pt-16 pb-24 grid lg:grid-cols-2 items-center gap-16">
          <div className="hero-copy relative z-20">
            <div className="eyebrow bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full inline-flex items-center gap-2 mb-6 font-bold text-xs uppercase tracking-widest shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> AI-assisted early screening
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-800 leading-[1.1] mb-6">
              Screen earlier.<br />
              <em className="text-emerald-600 not-italic font-serif relative">
                Act sooner.
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-emerald-200" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none"/></svg>
              </em>
            </h1>
            <p className="hero-lede text-lg lg:text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
              One calm, connected workspace for healthcare professionals to turn everyday health signals into timely clinical review.
            </p>
            <button 
              className="group bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold px-8 py-4 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all hover:-translate-y-1 flex items-center gap-3 border border-emerald-500/50" 
              onClick={onEnter}
            >
              Enter HealthSense 
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </button>
            <div className="mt-10 flex items-center gap-6 text-slate-500 font-medium text-sm">
              <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-500" /> HIPAA Compliant</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="flex items-center gap-2"><Activity size={18} className="text-blue-500" /> Evidence Based</span>
            </div>
          </div>
          
          <div className="hero-illustration-wrapper relative z-10">
            {/* Glow behind image */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-300/40 via-teal-200/30 to-blue-300/40 rounded-[3rem] blur-3xl transform scale-105 -z-10"></div>
            
            <img 
              src="/hero-illustration.jpg" 
              alt="Healthcare professionals treating and screening a patient" 
              className="w-full h-auto rounded-[2rem] shadow-2xl border-4 border-white/80 object-cover object-center bento-hover relative z-10 transition-transform duration-700 hover:scale-[1.02]"
              style={{ maxHeight: '600px' }}
            />
            
            {/* Floating badges */}
            <div className="absolute -left-8 top-1/4 bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-4 z-20 bento-hover">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <Brain size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">AI Insight</p>
                <p className="text-sm font-extrabold text-slate-800">Ready for review</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ml-2 animate-pulse" />
            </div>
            
            <div className="absolute -right-6 bottom-1/4 bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-4 z-20 bento-hover">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Vitals Sync</p>
                <p className="text-sm font-extrabold text-slate-800">Live updating</p>
              </div>
            </div>
          </div>
      </main>
    </div>
  );
}
