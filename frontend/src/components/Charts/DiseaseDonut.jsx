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
    <Card className="p-5 flex-1 min-w-[300px]">
      <div className="font-bold text-sm mb-1" style={{ color: C.text }}>Disease Risk Overview</div>
      <div className="text-xs mb-2" style={{ color: C.textFaint }}>Moderate + High risk referrals by disease</div>
      {total === 0 ? (
        <EmptyState text="No referrals yet" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
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
      )}
    </Card>
  );
}
