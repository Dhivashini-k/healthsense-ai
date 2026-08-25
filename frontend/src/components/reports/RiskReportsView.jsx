import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import MedicalReportPreview from "./MedicalReportPreview";
import { FileText, Eye, Printer, Search, Download, CheckCircle2, Clock } from "lucide-react";

export default function RiskReportsView() {
  const { screenings, activeReportScreening, setActiveReportScreening } = useApp();
  const [viewingReport, setViewingReport] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredScreenings = screenings.filter(
    (scr) =>
      scr.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scr.predictedDisease.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scr.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (viewingReport && activeReportScreening) {
    return (
      <MedicalReportPreview
        screening={activeReportScreening}
        onBack={() => setViewingReport(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" /> NCD Risk Reports Archive
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Generated medical risk assessment reports ready for physician signature and export.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search report by patient/ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-5">Report ID</th>
                <th className="py-3.5 px-5">Patient Name</th>
                <th className="py-3.5 px-5">Screening Date</th>
                <th className="py-3.5 px-5">Primary NCD Risk</th>
                <th className="py-3.5 px-5 text-center">Score</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredScreenings.map((scr) => (
                <tr key={scr.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-900">{scr.id}</td>
                  <td className="py-3.5 px-5 font-bold text-slate-900">{scr.patientName}</td>
                  <td className="py-3.5 px-5 text-slate-500">{scr.date}</td>
                  <td className="py-3.5 px-5 font-semibold text-slate-800">{scr.predictedDisease}</td>
                  <td className="py-3.5 px-5 text-center font-black text-emerald-600">{scr.overallRiskScore}%</td>
                  <td className="py-3.5 px-5">
                    {scr.doctorReviewStatus === "Reviewed" ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Signed
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                        <Clock className="w-3 h-3 text-amber-600" /> Draft
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => {
                        setActiveReportScreening(scr);
                        setViewingReport(true);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 ml-auto transition shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
