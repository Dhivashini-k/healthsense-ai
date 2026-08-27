import React from 'react';
import { useApp } from '../../context/AppContext';

export default function HighPriorityPatients({ screenings = [] }) {
  const highPriority = screenings
    .filter(s => s.overallRiskScore >= 60)
    .sort((a, b) => b.overallRiskScore - a.overallRiskScore)
    .slice(0, 4);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-black text-slate-800">High Priority Patients</h3>
        <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700">View All</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient ID</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Risk</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Score</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Assignment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {highPriority.map((pt, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-4 text-sm font-bold text-slate-700">{pt.patientId || pt.id}</td>
                <td className="py-4 px-4 text-sm font-semibold text-slate-800">{pt.patientName || pt.name}</td>
                <td className="py-4 px-4">
                  <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-full">
                    {pt.predictedDisease || pt.disease}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black ${(pt.overallRiskScore || pt.riskScore) >= 75 ? 'text-rose-500' : 'text-amber-500'}`}>
                      {pt.overallRiskScore || pt.riskScore}%
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      (pt.riskCategory || pt.urgency) === 'Critical' || (pt.riskCategory || pt.urgency) === 'High Risk' ? 'bg-rose-100 text-rose-700' : 
                      (pt.riskCategory || pt.urgency) === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {pt.riskCategory || pt.urgency}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-sm font-medium text-slate-600">{pt.assignedDoctor || pt.assignedTo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
