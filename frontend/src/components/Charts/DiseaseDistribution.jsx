import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../Common/Card';
import { C } from '../../utils/constants';
import { classify } from '../../utils/helpers';

export function DiseaseDistribution({ screenings, diseases }) {
  const [duration, setDuration] = useState("Monthly");
  const durMap = { Weekly: 7, Monthly: 30, Quarterly: 90, Yearly: 365 };
  const cutoff = Date.now() - durMap[duration] * 86400000;
  const filtered = screenings.filter((s) => new Date(s.date).getTime() >= cutoff);
  
  const data = diseases.map((d) => {
    const scores = filtered.map((s) => s.riskScores[d]);
    return {
      name: d,
      Low: scores.filter((v) => classify(v) === "Low").length,
      Moderate: scores.filter((v) => classify(v) === "Moderate").length,
      High: scores.filter((v) => classify(v) === "High").length,
    };
  });
  
  return (
    <Card className="p-5 flex-1 min-w-[340px]">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-bold text-sm" style={{ color: C.text }}>Disease-wise Risk Distribution</div>
          <div className="text-xs" style={{ color: C.textFaint }}>Patients per risk band</div>
        </div>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="text-xs px-2 py-1.5 rounded-lg border"
          style={{ borderColor: C.border }}
        >
          {Object.keys(durMap).map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Low" stackId="a" fill={C.low} radius={[0, 0, 0, 0]} />
          <Bar dataKey="Moderate" stackId="a" fill={C.moderate} />
          <Bar dataKey="High" stackId="a" fill={C.high} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
