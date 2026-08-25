import React from "react";
import { useApp } from "../../context/AppContext";

export default function HighRiskPanel() {
  const { patients, openPatientDetail, setActiveTab } = useApp();

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900">High-Risk Patients</h3>
        <button
          onClick={() => setActiveTab("patients")}
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
        >
          View All
        </button>
      </div>

      <div className="space-y-3 my-1">
        {patients.slice(0, 5).map((patient) => {
          const isHigh = patient.riskCategory === "High Risk" || patient.riskCategory === "Critical Risk";

          return (
            <div
              key={patient.id}
              onClick={() => openPatientDetail(patient)}
              className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={patient.avatar}
                  alt={patient.name}
                  className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{patient.name}</h4>
                  <p className="text-[10px] font-semibold text-slate-400 font-mono">ID: {patient.id}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-md ${
                    isHigh
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {patient.riskCategory}
                </span>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{patient.primaryRisk}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
