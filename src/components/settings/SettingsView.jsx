import React, { useState } from "react";
import { Settings, Cpu, ShieldCheck, Bell, Save, CheckCircle2 } from "lucide-react";

export default function SettingsView() {
  const [sensitivity, setSensitivity] = useState(75);
  const [useXGBoost, setUseXGBoost] = useState(true);
  const [autoFlagCritical, setAutoFlagCritical] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" /> Platform & AI Model Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure machine learning model thresholds, clinical sensitivity, and system preferences.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition"
        >
          <Save className="w-4 h-4" /> Save Configuration
        </button>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-100 text-emerald-900 rounded-2xl border border-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> AI Engine parameters and hospital preferences saved successfully.
        </div>
      )}

      {/* AI Risk Engine Parameters */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Risk Prediction Engine Configuration</h3>
            <p className="text-xs text-slate-500">XGBoost & CatBoost model hyper-parameters</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1 font-bold text-slate-700">
              <span>High Risk Cutoff Threshold: {sensitivity}%</span>
              <span className="text-emerald-600">Framingham / FINDRISC Adjusted</span>
            </div>
            <input
              type="range"
              min="50"
              max="90"
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <p className="text-[11px] text-slate-400 mt-1">Lowering threshold increases sensitivity for early detection screening.</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <span className="font-bold text-slate-800 block">Enable XGBoost Ensemble Predictor</span>
              <span className="text-slate-500 text-[11px]">Combines Gradient Boosting decision trees with clinical vital matrices.</span>
            </div>
            <input
              type="checkbox"
              checked={useXGBoost}
              onChange={() => setUseXGBoost(!useXGBoost)}
              className="accent-emerald-600 w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <span className="font-bold text-slate-800 block">Auto-Flag Critical Patients (&gt;75% Risk)</span>
              <span className="text-slate-500 text-[11px]">Sends high-priority notifications to attending cardiologist & neurologist.</span>
            </div>
            <input
              type="checkbox"
              checked={autoFlagCritical}
              onChange={() => setAutoFlagCritical(!autoFlagCritical)}
              className="accent-emerald-600 w-4 h-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
