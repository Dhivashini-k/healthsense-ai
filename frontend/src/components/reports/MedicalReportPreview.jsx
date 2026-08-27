import React from "react";
import { useApp } from "../../context/AppContext";
import { reportsAPI } from "../../services/api";
import {
  Printer,
  HeartPulse,
  QrCode,
  ShieldCheck,
  Stethoscope,
  ArrowLeft,
  Download
} from "lucide-react";

export default function MedicalReportPreview({ screening, onBack }) {
  const { patients } = useApp();
  const scr = screening;

  if (!scr) return null;

  const patient = patients.find((p) => p.id === scr.patientId || p.patient_id === scr.patientId) || {
    mrn: "MRN-125600",
    phone: "+91 98765 43210",
    email: "ramesh.verma@example.com",
    bloodGroup: "B+"
  };

  const handleDownloadPDF = () => {
    const reportUrl = reportsAPI.getReportUrl(patient.id || scr.patientId);
    window.open(reportUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="no-print flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={onBack}
          className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Reports List
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" /> Export Backend PDF Report
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4" /> Print View
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div
        id="printable-medical-report"
        className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg text-slate-900 space-y-6 max-w-4xl mx-auto"
      >
        {/* Hospital Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#033B2C] text-emerald-400 flex items-center justify-center font-black">
              <HeartPulse className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                HealthSense AI Medical Center
              </h1>
              <p className="text-xs text-slate-500 font-semibold">
                Institute for Non-Communicable Disease Screening & Epidemiology
              </p>
              <p className="text-[10px] text-slate-400">FastAPI & PostgreSQL Backend Integrated Node #884-NC</p>
            </div>
          </div>

          <div className="text-right">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-full">
              Official Medical Report
            </span>
            <p className="text-xs font-mono text-slate-500 mt-2">Report ID: {scr.id}</p>
            <p className="text-xs text-slate-500">Date Generated: {scr.date}</p>
          </div>
        </div>

        {/* Patient Demographics & Vitals Table */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Patient Identification
            </span>
            <p className="text-sm font-extrabold text-slate-900">{scr.patientName}</p>
            <p className="text-slate-600">Patient ID: <span className="font-mono font-bold text-slate-800">{scr.patientId}</span></p>
            <p className="text-slate-600">Age / Gender: <span className="font-semibold text-slate-800">{scr.age} yrs / {scr.gender}</span></p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Recorded Clinical Vitals
            </span>
            <p className="text-slate-600">Blood Pressure: <span className="font-bold text-slate-900">{scr.vitals?.bp}</span></p>
            <p className="text-slate-600">Resting Heart Rate: <span className="font-bold text-slate-900">{scr.vitals?.heartRate} BPM</span></p>
            <p className="text-slate-600">Oxygen Saturation: <span className="font-bold text-slate-900">{scr.vitals?.spo2}% SpO2</span></p>
            <p className="text-slate-600">Body Mass Index (BMI): <span className="font-bold text-slate-900">{scr.vitals?.bmi} kg/m²</span></p>
          </div>
        </div>

        {/* AI Disease Risk Breakdown Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> AI Machine-Learning NCD Risk Breakdown
            </h3>
            <span className="px-2.5 py-0.5 text-xs font-black bg-[#033B2C] text-emerald-400 rounded-md">
              Overall: {scr.overallRiskScore}% ({scr.riskCategory})
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {Object.entries(scr.riskBreakdown || {}).map(([disease, score]) => (
              <div key={disease} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 capitalize block">
                  {disease.replace(/([A-Z])/g, ' $1')}
                </span>
                <div className="flex items-center justify-between mt-2">
                  <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        score >= 70 ? "bg-brand-high-bg" : score >= 45 ? "bg-brand-moderate-bg" : "bg-brand-low-bg"
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-slate-900">{score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Diagnostic Notes */}
        <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs space-y-3">
          <div className="flex items-center gap-2 font-extrabold text-emerald-900 text-sm">
            <Stethoscope className="w-4 h-4 text-emerald-700" />
            <span>Physician Diagnostic Summary & Laboratory Orders</span>
          </div>
          <div>
            <span className="font-bold text-slate-700 block mb-0.5">Clinical Remarks:</span>
            <p className="text-slate-800 leading-relaxed italic">
              {scr.doctorNotes || "Stage 2 Hypertension indicators with elevated glycated hemoglobin risk. Confirmatory laboratory profile requested."}
            </p>
          </div>
        </div>

        {/* Verification Footer & Doctor Signature */}
        <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-xl border border-slate-200">
              <QrCode className="w-12 h-12 text-slate-800" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Cryptographic Verification Badge</p>
              <p className="text-[10px] text-slate-500 font-mono">Hash: 8f9a2c-901b-4e-2026-healthsense</p>
            </div>
          </div>

          <div className="text-right">
            <div className="w-40 border-b border-slate-400 pb-1 mb-1 font-serif text-slate-800 italic text-sm">
              Dr. Arjun Mehta, MD
            </div>
            <p className="font-bold text-slate-900">Attending Physician Sign-Off</p>
          </div>
        </div>
      </div>
    </div>
  );
}
