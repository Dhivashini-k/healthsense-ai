import React from 'react';
import { Users, ClipboardList, ClipboardCheck, Stethoscope } from 'lucide-react';
import { C, ROLES, ROLE_DISEASES, DISEASES } from '../../utils/constants';
import { KPICard } from '../Common/KPICard';
import { Card } from '../Common/Card';
import { StatusBadge } from '../Common/StatusBadge';
import DiseaseRiskTrendChart from '../dashboard/DiseaseRiskTrendChart';
import OperationalFunnelChart from '../dashboard/OperationalFunnelChart';
import HighPriorityPatients from '../dashboard/HighPriorityPatients';

export function AdminArea({ tab, db }) {
  if (tab === "users") {
    const rows = ROLES.map((r) => ({ role: r, count: r === "Nurse" ? 6 : r === "Super Admin" ? 1 : 2 }));
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold text-brand-text">Manage Users</h1>
        <Card className="p-5">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-brand-faint"><th className="pb-2">Role</th><th className="pb-2">Active Accounts</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.role} className="border-t border-brand-border">
                <td className="py-2.5 font-semibold text-brand-text">{r.role}</td>
                <td className="py-2.5 text-xs text-brand-muted">{r.count}</td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      </div>
    );
  }
  if (tab === "specialists") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold text-brand-text">Manage Specialists</h1>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(ROLE_DISEASES).map(([role, diseases]) => {
            const refs = db.referrals.filter((r) => diseases.includes(r.disease));
            return (
              <Card key={role} className="p-5">
                <div className="font-bold text-brand-text">{role}</div>
                <div className="text-xs mb-3 text-brand-faint">Handles: {diseases.join(", ")}</div>
                <div className="flex gap-4 text-sm">
                  <div><b>{refs.length}</b> <span className="text-brand-faint">total</span></div>
                  <div><b>{refs.filter((r) => r.status !== "Signed").length}</b> <span className="text-brand-faint">pending</span></div>
                  <div><b>{refs.filter((r) => r.status === "Signed").length}</b> <span className="text-brand-faint">signed</span></div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }
  if (tab === "reports") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold text-brand-text">Manage Reports</h1>
        <Card className="p-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-brand-faint"><th className="pb-2">Patient</th><th className="pb-2">Disease</th><th className="pb-2">Risk %</th><th className="pb-2">Specialist</th><th className="pb-2">Status</th></tr></thead>
            <tbody>{db.referrals.slice().reverse().map((r) => {
              const p = db.patients.find((x) => x.id === r.patientId);
              return (
                <tr key={r.id} className="border-t border-brand-border">
                  <td className="py-2.5 font-semibold text-brand-text">{p?.name}</td>
                  <td className="py-2.5 text-xs text-brand-muted">{r.disease}</td>
                  <td className={`py-2.5 text-xs font-bold ${r.riskLevel === 'High' ? 'text-brand-high' : 'text-brand-moderate'}`}>{r.riskPercent}%</td>
                  <td className="py-2.5 text-xs text-brand-muted">{r.specialistRole}</td>
                  <td className="py-2.5"><StatusBadge status={r.status} /></td>
                </tr>
              );
            })}</tbody>
          </table>
        </Card>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold text-brand-text">Global Analytics</h1>
      <div className="flex flex-wrap gap-4">
        <KPICard icon={Users} label="Total Patients" value={db.patients.length} />
        <KPICard icon={ClipboardList} label="Total Screenings" value={db.screenings.length} color={C.accent} />
        <KPICard icon={ClipboardCheck} label="Total Referrals" value={db.referrals.length} color={C.moderate} />
        <KPICard icon={Stethoscope} label="Active Specialists" value={4} color={C.primary} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DiseaseRiskTrendChart screenings={db.screenings} />
        <OperationalFunnelChart screenings={db.screenings} referrals={db.referrals} />
      </div>
      <div className="w-full">
        <HighPriorityPatients screenings={db.screenings} />
      </div>
    </div>
  );
}
