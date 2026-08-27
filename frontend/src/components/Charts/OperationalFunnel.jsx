import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Card } from '../Common/Card';
import { C } from '../../utils/constants';

/**
 * Operational Funnel Chart — Shows the screening pipeline:
 * Screened → High Risk → Referred → Completed → Pending
 * 
 * Adapted from orphaned dashboard component to work with App.jsx props.
 */
export function OperationalFunnel({ screenings, referrals }) {
  const data = useMemo(() => {
    const total = screenings.length || 0;
    const highRisk = referrals.filter((r) => r.riskLevel === "High").length;
    const referred = referrals.length;
    const completed = referrals.filter((r) => r.status === "Signed").length;
    const pending = referrals.filter((r) => r.status !== "Signed").length;

    return [
      { stage: 'Screened', count: total, color: '#0E7C5A' },
      { stage: 'Flagged', count: referred, color: '#C67C0E' },
      { stage: 'High Risk', count: highRisk, color: '#D64545' },
      { stage: 'Completed', count: completed, color: '#12A886' },
      { stage: 'Pending', count: pending, color: '#8CA098' },
    ];
  }, [screenings, referrals]);

  const total = screenings.length || 1;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-xl text-xs">
          <p className="font-bold text-slate-800 mb-1">{d.stage}</p>
          <p className="text-slate-600">Count: <span className="font-bold">{d.count}</span></p>
          <p className="text-slate-600">Of total: <span className="font-bold">{((d.count / total) * 100).toFixed(0)}%</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-5 flex-1 min-w-[340px]">
      <div className="mb-3">
        <div className="font-bold text-sm text-brand-text">Screening & Follow-up Pipeline</div>
        <div className="text-xs text-brand-faint">Operational funnel from screening to completion</div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={C.border} />
          <XAxis type="number" hide />
          <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false}
            tick={{ fill: C.text, fontSize: 11, fontWeight: 600 }} width={70} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8faf9' }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={26}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList dataKey="count" position="right"
              formatter={(val) => `${val} (${((val / total) * 100).toFixed(0)}%)`}
              className="fill-brand-muted text-[11px] font-semibold" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
