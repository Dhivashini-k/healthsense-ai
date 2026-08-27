import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../Common/Card';
import { EmptyState } from '../Common/EmptyState';
import { C, DISEASE_COLOR } from '../../utils/constants';

export function DiseaseDonut({ referrals, diseases }) {
  const data = diseases.map((d) => ({
    name: d,
    value: referrals.filter((r) => r.disease === d).length
  }));
  const total = data.reduce((a, b) => a + b.value, 0);
  
  return (
    <Card className="p-5 flex-1 w-full overflow-hidden">
      <div className="font-bold text-sm text-brand-text mb-1">Disease Risk Overview</div>
      <div className="text-xs text-brand-faint mb-4">Moderate + High risk referrals by disease</div>
      {total === 0 ? (
        <EmptyState text="No referrals yet" />
      ) : (
        <div className="w-full h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
              {data.map((d, i) => (
                <Cell key={i} fill={DISEASE_COLOR[d.name]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
