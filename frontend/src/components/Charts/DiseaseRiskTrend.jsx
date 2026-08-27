import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../Common/Card';
import { EmptyState } from '../Common/EmptyState';
import { C, DISEASE_COLOR } from '../../utils/constants';
import { classify } from '../../utils/helpers';

/**
 * Disease Risk Trend — Time-series chart showing screening counts
 * grouped by disease, with disease/date/risk filters.
 * 
 * Adapted from orphaned dashboard component to work with App.jsx props.
 */
export function DiseaseRiskTrend({ screenings, diseases }) {
  const [diseaseFilter, setDiseaseFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("30D");

  const chartData = useMemo(() => {
    const now = Date.now();
    const msPerDay = 86400000;
    const daysMap = { Today: 1, "7D": 7, "30D": 30, "3M": 90, All: 9999 };
    const cutoff = now - (daysMap[dateFilter] || 30) * msPerDay;

    const filtered = screenings.filter((s) => new Date(s.date).getTime() >= cutoff);
    const grouped = {};

    filtered.forEach((s) => {
      const key = s.date; // YYYY-MM-DD
      if (!grouped[key]) {
        grouped[key] = { date: key.slice(5), Diabetes: 0, Hypertension: 0, CVD: 0, Stroke: 0, CKD: 0, HighRisk: 0 };
      }
      if (s.riskScores) {
        const scores = Object.entries(s.riskScores);
        scores.forEach(([d, risk]) => {
          if (diseaseFilter === "All" || diseaseFilter === d) {
            grouped[key][d] = (grouped[key][d] || 0) + 1;
          }
        });
        const maxRisk = Math.max(...scores.map(([, v]) => v));
        if (maxRisk >= 60) grouped[key].HighRisk += 1;
      }
    });

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [screenings, diseaseFilter, dateFilter]);

  const lineColors = {
    Diabetes: DISEASE_COLOR.Diabetes,
    Hypertension: DISEASE_COLOR.Hypertension,
    CVD: DISEASE_COLOR.CVD,
    Stroke: DISEASE_COLOR.Stroke,
    CKD: DISEASE_COLOR.CKD,
  };

  return (
    <Card className="p-5 flex-1 w-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <div className="font-bold text-sm text-brand-text">Disease Risk Trend</div>
          <div className="text-xs text-brand-faint mt-0.5">Screening volume by disease over time</div>
        </div>
        <div className="flex gap-2">
          <select value={diseaseFilter} onChange={(e) => setDiseaseFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-brand-border bg-transparent outline-none focus:ring-1 focus:ring-brand-green">
            <option value="All">All Diseases</option>
            {diseases.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-brand-border bg-transparent outline-none focus:ring-1 focus:ring-brand-green">
            <option value="Today">Today</option>
            <option value="7D">7 Days</option>
            <option value="30D">30 Days</option>
            <option value="3M">3 Months</option>
            <option value="All">All Time</option>
          </select>
        </div>
      </div>
      {chartData.length === 0 ? (
        <EmptyState text="No screening data in this range" />
      ) : (
        <div className="w-full h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            {(diseaseFilter === "All" ? diseases : [diseaseFilter]).map((d) => (
              <Line key={d} type="monotone" dataKey={d} stroke={lineColors[d]} strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 2 }} name={d} />
            ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
