import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { MOCK_DISEASE_DISTRIBUTION } from "../../data/mockData";
import { BarChart3, Activity, Clock, ShieldCheck, Award, Zap } from "lucide-react";

export default function AnalyticsView() {
  const [timeFilter, setTimeFilter] = useState("Month");

  // Multiplied data for different time filters
  const getChartData = () => {
    const multiplier = timeFilter === "Week" ? 0.25 : timeFilter === "Year" ? 12 : 1;
    return MOCK_DISEASE_DISTRIBUTION.map((item) => ({
      ...item,
      count: Math.round(item.count * multiplier)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" /> Hospital Analytics & Clinical KPIs
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time Non-Communicable Disease population health analytics and hospital operational metrics.
          </p>
        </div>

        {/* Time Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs">
          {["Week", "Month", "Year"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFilter(tf)}
              className={`px-4 py-1.5 rounded-xl font-bold transition ${
                timeFilter === tf ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Hospital KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Screening Accuracy</span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">96.8%</p>
          <span className="text-[11px] font-bold text-emerald-600 mt-1 block">Validated against Lab Tests</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Avg Review Time</span>
            <div className="p-2 bg-teal-100 text-teal-700 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">1.4 Hours</p>
          <span className="text-[11px] font-bold text-teal-600 mt-1 block">-24 mins from last month</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Early Intervention</span>
            <div className="p-2 bg-cyan-100 text-cyan-700 rounded-xl">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">88.4%</p>
          <span className="text-[11px] font-bold text-cyan-600 mt-1 block">Prevented severe progression</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Patient Satisfaction</span>
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">4.9 / 5.0</p>
          <span className="text-[11px] font-bold text-indigo-600 mt-1 block">Based on 1,240 reviews</span>
        </div>
      </div>

      {/* Disease Volume Bar Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Disease Screening Volume & Distribution</h3>
            <p className="text-xs text-slate-500">Comparative breakdown by risk detection count ({timeFilter} View)</p>
          </div>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderRadius: "12px",
                  border: "1px solid #334155",
                  color: "#ffffff",
                  fontSize: "12px"
                }}
              />
              <Bar dataKey="count" fill="#0D9488" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
