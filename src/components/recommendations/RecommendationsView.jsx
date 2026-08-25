import React, { useState } from "react";
import { MOCK_RECOMMENDATIONS_DATABASE } from "../../data/mockData";
import {
  Lightbulb,
  Utensils,
  Dumbbell,
  HeartPulse,
  CalendarCheck,
  UserCheck,
  CheckCircle2,
  Sparkles
} from "lucide-react";

export default function RecommendationsView() {
  const [selectedDisease, setSelectedDisease] = useState("Diabetes");

  const data = MOCK_RECOMMENDATIONS_DATABASE[selectedDisease] || MOCK_RECOMMENDATIONS_DATABASE.Diabetes;

  const DISEASES = [
    { key: "Diabetes", label: "Diabetes Mellitus" },
    { key: "HeartDisease", label: "Coronary Heart Disease" },
    { key: "Hypertension", label: "Hypertension" },
    { key: "Stroke", label: "Cerebrovascular / Stroke" },
    { key: "CKD", label: "Chronic Kidney Disease" },
    { key: "Cancer", label: "Cancer Risk Prevention" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-emerald-600" /> Personalized NCD Recommendation Engine
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Clinical diet, exercise, lifestyle, checkup, and specialist referral guidelines tailored to predicted risk levels.
          </p>
        </div>

        {/* Disease Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs">
          {DISEASES.map((d) => (
            <button
              key={d.key}
              onClick={() => setSelectedDisease(d.key)}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                selectedDisease === d.key
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Recommendation Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Diet Plan */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Personalized Diet & Nutrition Plan</h3>
              <p className="text-xs text-slate-500">Therapeutic dietary interventions</p>
            </div>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-700">
            {data.diet.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 2. Exercise & Physical Activity */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-teal-300 transition">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Exercise & Mobility Protocol</h3>
              <p className="text-xs text-slate-500">Targeted cardiovascular & strength routine</p>
            </div>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-700">
            {data.exercise.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Lifestyle Modifications */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-cyan-300 transition">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-cyan-100 text-cyan-700 rounded-2xl">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Lifestyle & Habit Modifications</h3>
              <p className="text-xs text-slate-500">Sleep, stress & monitoring routines</p>
            </div>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-700">
            {data.lifestyle.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 4. Checkups & Specialist Referrals */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-indigo-300 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Required Medical Checkups</h3>
                <p className="text-xs text-slate-500">Routine monitoring frequency</p>
              </div>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
              {data.checkups.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recommended Specialist Referral</span>
                <span className="text-xs font-extrabold text-white">{data.specialist}</span>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-500 text-slate-950 text-[10px] font-extrabold rounded-full">
              Automated Match
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
