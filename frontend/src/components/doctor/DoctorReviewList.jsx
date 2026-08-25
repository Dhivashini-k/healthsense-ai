import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Stethoscope, CheckCircle2, Clock, Eye, AlertTriangle, FileText, Search, Filter } from "lucide-react";

export default function DoctorReviewList() {
  const { screenings, openDoctorReview, openPatientDetail, patients, setActiveReportScreening, setActiveTab } = useApp();
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchFilter, setSearchFilter] = useState("");

  const filteredScreenings = screenings.filter((scr) => {
    const matchesStatus = filterStatus === "All" || scr.doctorReviewStatus === filterStatus;
    const matchesSearch =
      scr.patientName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      scr.predictedDisease.toLowerCase().includes(searchFilter.toLowerCase()) ||
      scr.patientId.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-emerald-600" /> Doctor Review Workspace
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Validate AI risk engine predictions, append clinical diagnosis notes, and order confirmatory diagnostic lab panels.
          </p>
        </div>

        {/* Filter & Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by patient name/disease..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {["All", "Pending", "Reviewed"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  filterStatus === status ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Screenings Queue Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredScreenings.map((scr) => {
          const patient = patients.find((p) => p.id === scr.patientId) || {
            avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"
          };
          const isPending = scr.doctorReviewStatus === "Pending";
          const isCritical = scr.overallRiskScore >= 75;

          return (
            <div
              key={scr.id}
              className={`p-5 rounded-2xl bg-white border transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${
                isCritical ? "border-rose-200" : "border-slate-200"
              }`}
            >
              <div>
                {/* Top Badge Row */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400">{scr.id}</span>
                  {isPending ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Reviewed
                    </span>
                  )}
                </div>

                {/* Patient Header */}
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={patient.avatar}
                    alt={scr.patientName}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/20"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{scr.patientName}</h3>
                    <p className="text-xs text-slate-500">
                      {scr.age} yrs • {scr.gender} • BP: {scr.vitals?.bp}
                    </p>
                  </div>
                </div>

                {/* Risk Prediction Box */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Predicted Disease:</span>
                    <span className="font-bold text-slate-900">{scr.predictedDisease}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Risk Severity:</span>
                    <span className={`font-black ${isCritical ? "text-rose-600" : "text-amber-600"}`}>
                      {scr.riskCategory} ({scr.overallRiskScore}%)
                    </span>
                  </div>
                </div>

                {/* Existing Doctor Notes */}
                {scr.doctorNotes && (
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-900 mb-4">
                    <span className="font-bold block mb-0.5">Doctor Remarks:</span>
                    <p className="text-[11px] italic">{scr.doctorNotes}</p>
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openDoctorReview(scr)}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>{isPending ? "Perform Review" : "Edit Review"}</span>
                </button>
                <button
                  onClick={() => {
                    setActiveReportScreening(scr);
                    setActiveTab("reports");
                  }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs transition"
                  title="View PDF Report"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
