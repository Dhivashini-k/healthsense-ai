import React from "react";
import { useApp } from "../../context/AppContext";
import { Eye, BellRing, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function RecentScreeningsTable() {
  const {
    screenings,
    openDoctorReview,
    setActiveReportScreening,
    setActiveTab,
    sendReminder,
    userRole
  } = useApp();

  const handleViewReport = (scr) => {
    setActiveReportScreening(scr);
    setActiveTab("reports");
  };

  const handleSendReminder = (scr) => {
    sendReminder(scr.patientId || scr.id);
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Recent Patient Screenings</h3>
          <p className="text-xs text-slate-500">Live AI NCD risk assessments and specialist referral status</p>
        </div>

        <button
          onClick={() => setActiveTab("reports")}
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
        >
          View All Reports →
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Patient ID</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Screening Date</th>
              <th className="py-3 px-4">Disease Risk Summary</th>
              <th className="py-3 px-4">Assigned Specialist</th>
              <th className="py-3 px-4 text-center">Report Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {screenings.map((scr) => (
              <tr key={scr.id} className="hover:bg-slate-50 transition">
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{scr.patientId || scr.id}</td>
                <td className="py-3.5 px-4 font-bold text-slate-900">{scr.patientName}</td>
                <td className="py-3.5 px-4 text-slate-500">{scr.date}</td>
                
                {/* 5 Colored Risk Indicator Dots */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" title="Diabetes Risk > 70%" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" title="Hypertension Risk > 50%" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="CVD Risk Low" />
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" title="Stroke Risk High" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="CKD Risk Low" />
                    <span className="text-[10px] font-bold text-slate-700 ml-1">
                      {scr.overallRiskScore}% ({scr.riskCategory})
                    </span>
                  </div>
                </td>

                <td className="py-3.5 px-4 font-semibold text-emerald-800">
                  {scr.assignedSpecialist || "Endocrinologist"}
                </td>

                {/* Report Status Badge */}
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      scr.reportStatus === "Signed"
                        ? "bg-emerald-100 text-emerald-800"
                        : scr.reportStatus === "Sent"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {scr.reportStatus === "Signed" ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Clock className="w-3 h-3 text-amber-600" />
                    )}
                    {scr.reportStatus || "Draft"}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleViewReport(scr)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] flex items-center gap-1 transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>

                    {scr.reportStatus === "Draft" && userRole === "nurse" && (
                      <button
                        onClick={() => handleSendReminder(scr)}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 transition shadow-2xs"
                      >
                        <BellRing className="w-3.5 h-3.5" /> Send Reminder
                      </button>
                    )}

                    {userRole !== "nurse" && scr.reportStatus !== "Signed" && (
                      <button
                        onClick={() => openDoctorReview(scr)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition shadow-2xs"
                      >
                        Sign Report
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
