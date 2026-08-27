import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';

export default function OperationalFunnelChart({ screenings = [], referrals = [] }) {
  const data = useMemo(() => {
    const total = screenings.length || 0;
    const highRisk = referrals.filter(r => r.riskLevel === "High").length || 0;
    const referred = referrals.length || 0;
    const pending = referrals.filter(r => r.status !== "Signed").length || 0;
    const completed = referrals.filter(r => r.status === "Signed").length || 0;

    return [
      { stage: 'Screened', count: total, color: '#3b82f6' }, // blue
      { stage: 'High Risk', count: highRisk, color: '#f43f5e' }, // rose
      { stage: 'Referred', count: referred, color: '#f59e0b' }, // amber
      { stage: 'Completed', count: completed, color: '#10b981' }, // emerald
      { stage: 'Pending', count: pending, color: '#64748b' }, // slate
    ];
  }, [screenings, referrals]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = screenings.length || 1; // avoid div by 0
      const percentage = ((data.count / total) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-md rounded-xl text-sm">
          <p className="font-bold text-slate-800 mb-1">{data.stage}</p>
          <p className="text-slate-600">Count: <span className="font-bold text-slate-900">{data.count}</span></p>
          <p className="text-slate-600">Conversion: <span className="font-bold text-slate-900">{percentage}%</span></p>
        </div>
      );
    }
    return null;
  };

  const renderCustomBarLabel = ({ x, y, width, height, value }) => {
    return (
      <text x={x + width + 10} y={y + height / 2} fill="#475569" dy={4} fontSize={12} fontWeight={700}>
        {value} ({((value / (screenings.length || 1)) * 100).toFixed(1)}%)
      </text>
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-black text-slate-800">Operational Funnel</h3>
        <p className="text-sm text-slate-500 font-medium">Screening → Referral → Follow-up pipeline</p>
      </div>
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 80, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" hide />
            <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 13, fontWeight: 600}} />
            <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}} />
            <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={32}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList dataKey="count" content={renderCustomBarLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
