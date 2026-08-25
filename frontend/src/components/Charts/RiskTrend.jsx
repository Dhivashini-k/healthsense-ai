import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../Common/Card';
import { EmptyState } from '../Common/EmptyState';
import { C, DISEASE_COLOR } from '../../utils/constants';

export function RiskTrend({ screenings, diseases }) {
  const [disease, setDisease] = useState(diseases[0]);
  const [duration, setDuration] = useState("30 Days");
  const durMap = { "7 Days": 7, "30 Days": 30, "3 Months": 90, "6 Months": 180, "1 Year": 365 };
  const days = durMap[duration];
  const cutoff = Date.now() - days * 86400000;
  const filtered = screenings.filter((s) => new Date(s.date).getTime() >= cutoff);
  
  const byDate = {};
  filtered.forEach((s) => {
    byDate[s.date] = byDate[s.date] || [];
    byDate[s.date].push(s.riskScores[disease]);
  });
  const data = Object.entries(byDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, vals]) => ({
      date: date.slice(5),
      avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }));
  
  return (
    <Card className="p-5 flex-[1.4] min-w-[340px]">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div>
          <div className="font-bold text-sm" style={{ color: C.text }}>Risk Trend</div>
          <div className="text-xs" style={{ color: C.textFaint }}>Average predicted risk over time</div>
        </div>
        <div className="flex gap-2">
          <select
            value={disease}
            onChange={(e) => setDisease(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-lg border"
            style={{ borderColor: C.border }}
          >
            {diseases.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-lg border"
            style={{ borderColor: C.border }}
          >
            {Object.keys(durMap).map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>
      {data.length === 0 ? (
        <EmptyState text="Not enough data in this range" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="avg"
              stroke={DISEASE_COLOR[disease]}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name={`${disease} risk %`}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
