import React from 'react';
import { Card } from '../Common/Card';
import { RiskBadge } from '../Common/RiskBadge';
import { EmptyState } from '../Common/EmptyState';
import { C } from '../../utils/constants';
import { fmtDate, classify } from '../../utils/helpers';
import { Eye, FileText } from 'lucide-react';
import { Button } from '../Common/Button';

/**
 * High Priority Patients Table — Displays high-risk patients
 * sorted by risk score.
 */
export function HighPriorityPatients({ referrals, patients }) {
  const highRisk = referrals
    .filter((r) => r.riskLevel === "High" || r.riskLevel === "Moderate")
    .sort((a, b) => {
      // Sort by risk level (High first), then by risk percent
      if (a.riskLevel === "High" && b.riskLevel !== "High") return -1;
      if (a.riskLevel !== "High" && b.riskLevel === "High") return 1;
      return b.riskPercent - a.riskPercent;
    });

  const getPatient = (id) => patients.find((p) => p.id === id) || {};

  return (
    <Card className="p-5 mt-5">
      <div className="font-bold text-sm text-brand-text mb-1">High Priority Patients</div>
      <div className="text-xs text-brand-faint mb-4">Patients requiring immediate specialist review or follow-up</div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-brand-border text-brand-faint">
              <th className="pb-3 font-semibold">Patient</th>
              <th className="pb-3 font-semibold">Age</th>
              <th className="pb-3 font-semibold">Disease Risk</th>
              <th className="pb-3 font-semibold">Risk Score</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold">Specialist</th>
              <th className="pb-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {highRisk.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8">
                  <EmptyState text="No high priority patients currently" />
                </td>
              </tr>
            ) : (
              highRisk.slice(0, 10).map((r) => {
                const pt = getPatient(r.patientId);
                return (
                  <tr key={r.id} className="border-b last:border-0 border-brand-border hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-semibold text-brand-text">{pt.name || "Unknown"}</td>
                    <td className="py-3 text-brand-muted">{pt.age}</td>
                    <td className="py-3 text-brand-muted">{r.disease}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${r.riskLevel === 'High' ? 'bg-brand-coral' : 'bg-brand-amber'}`} 
                            style={{ width: `${r.riskPercent}%` }} 
                          />
                        </div>
                        <span className={`font-bold ${r.riskLevel === 'High' ? 'text-brand-coral' : 'text-brand-amber'}`}>
                          {r.riskPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <RiskBadge level={r.riskLevel} />
                    </td>
                    <td className="py-3 text-brand-muted text-xs">{r.specialistRole}</td>
                    <td className="py-3 text-right">
                      <Button variant="outline" className="text-xs px-2 py-1 h-auto">
                        <Eye size={14} className="mr-1" /> View
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
