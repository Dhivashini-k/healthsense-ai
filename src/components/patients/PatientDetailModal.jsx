import React from "react";
import { useApp } from "../../context/AppContext";
import { X, User, Heart, Activity, Calendar, Stethoscope, Phone, Mail, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function PatientDetailModal() {
  const { selectedPatient, isDetailModalOpen, setIsDetailModalOpen, screenings, openDoctorReview } = useApp();

  if (!isDetailModalOpen || !selectedPatient) return null;

  const patientScreenings = screenings.filter((s) => s.patientId === selectedPatient.id);
  const latestScreening = patientScreenings[0] || screenings[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn my-8">
        {/* Top Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={selectedPatient.avatar}
              alt={selectedPatient.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-400 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{selectedPatient.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-slate-950">
                  {selectedPatient.riskCategory}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                MRN: <span className="font-mono text-emerald-400 font-bold">{selectedPatient.mrn}</span> • {selectedPatient.age} yrs • {selectedPatient.gender} • Blood Group: {selectedPatient.bloodGroup}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDetailModalOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Contact & Info Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{selectedPatient.email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{selectedPatient.phone}</span>
            </div>
          </div>

          {/* Vitals Cards */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Recorded Vitals</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Blood Pressure</span>
                <p className="text-sm font-extrabold text-slate-900 mt-1">{selectedPatient.bpSystolic}/{selectedPatient.bpDiastolic} mmHg</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Heart Rate</span>
                <p className="text-sm font-extrabold text-slate-900 mt-1">{selectedPatient.heartRate} BPM</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">SpO2 Oxygen</span>
                <p className="text-sm font-extrabold text-slate-900 mt-1">{selectedPatient.spo2}%</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">BMI Metric</span>
                <p className="text-sm font-extrabold text-slate-900 mt-1">{selectedPatient.bmi} kg/m²</p>
              </div>
            </div>
          </div>

          {/* Medical History & Symptoms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Medical History</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {(selectedPatient.medicalHistory || []).map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Reported Symptoms</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {(selectedPatient.symptoms || []).map((sym, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-rose-700 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>{sym}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Assigned Doctor & Status */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Assigned Physician</span>
              <p className="text-xs font-extrabold text-slate-900 mt-0.5">{selectedPatient.assignedDoctor}</p>
            </div>
            <button
              onClick={() => {
                setIsDetailModalOpen(false);
                openDoctorReview(latestScreening);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              Review Screening
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
