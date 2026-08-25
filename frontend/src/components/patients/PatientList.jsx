import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import PatientDetailModal from "./PatientDetailModal";
import AddPatientModal from "./AddPatientModal";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Stethoscope,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Activity
} from "lucide-react";

export default function PatientList() {
  const { patients, openPatientDetail, setIsAddPatientModalOpen, screenings, openDoctorReview } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.primaryRisk.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === "All" || patient.riskCategory === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* Modals */}
      <PatientDetailModal />
      <AddPatientModal />

      {/* Header */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" /> Patient Registry & Medical Records
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive patient directory with historical NCD risk trends and clinical screening files.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddPatientModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" /> Add New Patient
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient name, ID, or condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Risk Filter:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {["All", "Low Risk", "Moderate Risk", "High Risk", "Critical Risk"].map((rf) => (
              <button
                key={rf}
                onClick={() => setRiskFilter(rf)}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                  riskFilter === rf
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {rf.replace(" Risk", "")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => {
          const isCritical = patient.riskCategory === "Critical Risk";
          const isHigh = patient.riskCategory === "High Risk";
          const matchingScr = screenings.find((s) => s.patientId === patient.id) || screenings[0];

          return (
            <div
              key={patient.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400">{patient.id}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isCritical
                        ? "bg-rose-100 text-rose-800"
                        : isHigh
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {patient.riskCategory} ({patient.overallRiskScore}%)
                  </span>
                </div>

                <div className="flex items-center gap-3.5 mb-4">
                  <img
                    src={patient.avatar}
                    alt={patient.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/20 shrink-0"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{patient.name}</h3>
                    <p className="text-xs text-slate-500">
                      {patient.age} yrs • {patient.gender} • MRN: {patient.mrn}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600 mb-4">
                  <div className="flex justify-between">
                    <span>Primary Risk:</span>
                    <span className="font-bold text-slate-900">{patient.primaryRisk}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Blood Pressure:</span>
                    <span className="font-bold text-slate-800">{patient.bpSystolic}/{patient.bpDiastolic} mmHg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BMI Index:</span>
                    <span className="font-bold text-slate-800">{patient.bmi} kg/m²</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openPatientDetail(patient)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" /> View Profile
                </button>
                <button
                  onClick={() => openDoctorReview(matchingScr)}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition shadow-xs"
                >
                  <Stethoscope className="w-3.5 h-3.5" /> Clinical Review
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
