import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import { MOCK_MONTHLY_TRENDS } from "../../data/mockData";
import { ChevronDown } from "lucide-react";

export default function TrendAnalysisChart() {
  const [selectedDisease, setSelectedDisease] = useState("All");

  const COLORS = {
    Diabetes: "#10B981",
    HeartDisease: "#EF4444",
    Hypertension: "#F59E0B",
    CKD: "#8B5CF6",
    Stroke: "#3B82F6"
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Risk Trend <span className="text-slate-400 font-normal text-xs">(Last 6 Months)</span></h3>
        </div>

        <div className="relative">
          <select
            value={selectedDisease}
            onChange={(e) => setSelectedDisease(e.target.value)}
            className="appearance-none text-xs bg-slate-50 border border-slate-200 font-semibold text-slate-700 rounded-xl pl-3 pr-8 py-1.5 focus:outline-none"
          >
            <option value="All">All Diseases</option>
            <option value="Diabetes">Diabetes</option>
            <option value="HeartDisease">Heart Disease</option>
            <option value="Hypertension">Hypertension</option>
            <option value="CKD">CKD</option>
            <option value="Stroke">Stroke</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={MOCK_MONTHLY_TRENDS} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderRadius: "12px",
                border: "1px solid #334155",
                color: "#ffffff",
                fontSize: "12px"
              }}
            />

            {(selectedDisease === "All" || selectedDisease === "Diabetes") && (
              <Line type="monotone" dataKey="Diabetes" stroke={COLORS.Diabetes} strokeWidth={2} dot={{ r: 3 }} />
            )}
            {(selectedDisease === "All" || selectedDisease === "HeartDisease") && (
              <Line type="monotone" dataKey="HeartDisease" stroke={COLORS.HeartDisease} strokeWidth={2} dot={{ r: 3 }} />
            )}
            {(selectedDisease === "All" || selectedDisease === "Hypertension") && (
              <Line type="monotone" dataKey="Hypertension" stroke={COLORS.Hypertension} strokeWidth={2} dot={{ r: 3 }} />
            )}
            {(selectedDisease === "All" || selectedDisease === "CKD") && (
              <Line type="monotone" dataKey="CKD" stroke={COLORS.CKD} strokeWidth={2} dot={{ r: 3 }} />
            )}
            {(selectedDisease === "All" || selectedDisease === "Stroke") && (
              <Line type="monotone" dataKey="Stroke" stroke={COLORS.Stroke} strokeWidth={2} dot={{ r: 3 }} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Row */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-slate-600">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Diabetes</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#EF4444]" /> Heart Disease</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Hypertension</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#8B5CF6]" /> CKD</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#3B82F6]" /> Stroke</div>
      </div>
    </div>
  );
}
