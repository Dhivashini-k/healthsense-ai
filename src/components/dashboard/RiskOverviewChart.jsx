import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { MOCK_DISEASE_DISTRIBUTION } from "../../data/mockData";
import { useApp } from "../../context/AppContext";
import { ArrowRight } from "lucide-react";

export default function RiskOverviewChart() {
  const { setActiveTab } = useApp();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs border border-slate-700">
          <p className="font-bold text-emerald-400">{data.name}</p>
          <p className="text-slate-300 mt-0.5">
            Patients: <span className="font-bold text-white">{data.count}</span> ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between h-full">
      <div className="mb-2">
        <h3 className="text-sm font-bold text-slate-900">Disease Risk Overview</h3>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 my-2">
        {/* Donut Chart */}
        <div className="w-44 h-44 relative shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={MOCK_DISEASE_DISTRIBUTION}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={2}
                dataKey="percentage"
              >
                {MOCK_DISEASE_DISTRIBUTION.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="#ffffff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center Summary */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Total</span>
            <span className="text-base font-black text-slate-900 leading-tight">1,248</span>
            <span className="text-[9px] font-bold text-slate-400">Patients</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-2 text-xs w-full">
          {MOCK_DISEASE_DISTRIBUTION.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                <span className="text-slate-700 font-semibold">{item.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-slate-900">{item.percentage}%</span>
                <span className="text-[10px] text-slate-400 font-normal">({item.count})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-medium">Only high & moderate risk cases are included.</span>
        <button
          onClick={() => setActiveTab("reports")}
          className="font-bold text-slate-700 hover:text-emerald-600 flex items-center gap-1 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-slate-200 transition"
        >
          View Full Report <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
