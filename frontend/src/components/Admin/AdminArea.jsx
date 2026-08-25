import React from 'react';
import { Users, ClipboardList, ClipboardCheck, Stethoscope } from 'lucide-react';
import { C, ROLES, ROLE_DISEASES, DISEASES } from '../../utils/constants';
import { KPICard } from '../Common/KPICard';
import { Card } from '../Common/Card';
import { StatusBadge } from '../Common/StatusBadge';
import { DiseaseDonut } from '../Charts/DiseaseDonut';
import { RiskTrend } from '../Charts/RiskTrend';
import { DiseaseDistribution } from '../Charts/DiseaseDistribution';

export function AdminArea({ tab, db }) {
  if (tab === "users") {
    const rows = ROLES.map((r) => ({ role: r, count: r === "Nurse" ? 6 : r === "Super Admin" ? 1 : 2 }));
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold" style={{ color: C.text }}>Manage Users</h1>
        <Card className="p-5">
          <table className="w-full text-sm">
            <thead><tr className="text-left" style={{ color: C.textFaint }}><th className="pb-2">Role</th><th className="pb-2">Active Accounts</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.role} className="border-t" style={{ borderColor: C.border }}>
                <td className="py-2.5 font-semibold" style={{ color: C.text }}>{r.role}</td>
                <td className="py-2.5 text-xs" style={{ color: C.textMuted }}>{r.count}</td>
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
        <h1 className="text-2xl font-extrabold" style={{ color: C.text }}>Manage Specialists</h1>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(ROLE_DISEASES).map(([role, diseases]) => {
            const refs = db.referrals.filter((r) => diseases.includes(r.disease));
            return (
              <Card key={role} className="p-5">
                <div className="font-bold" style={{ color: C.text }}>{role}</div>
                <div className="text-xs mb-3" style={{ color: C.textFaint }}>Handles: {diseases.join(", ")}</div>
                <div className="flex gap-4 text-sm">
                  <div><b>{refs.length}</b> <span style={{ color: C.textFaint }}>total</span></div>
                  <div><b>{refs.filter((r) => r.status !== "Signed").length}</b> <span style={{ color: C.textFaint }}>pending</span></div>
                  <div><b>{refs.filter((r) => r.status === "Signed").length}</b> <span style={{ color: C.textFaint }}>signed</span></div>
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
        <h1 className="text-2xl font-extrabold" style={{ color: C.text }}>Manage Reports</h1>
        <Card className="p-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left" style={{ color: C.textFaint }}><th className="pb-2">Patient</th><th className="pb-2">Disease</th><th className="pb-2">Risk %</th><th className="pb-2">Specialist</th><th className="pb-2">Status</th></tr></thead>
            <tbody>{db.referrals.slice().reverse().map((r) => {
              const p = db.patients.find((x) => x.id === r.patientId);
              return (
                <tr key={r.id} className="border-t" style={{ borderColor: C.border }}>
                  <td className="py-2.5 font-semibold" style={{ color: C.text }}>{p?.name}</td>
                  <td className="py-2.5 text-xs" style={{ color: C.textMuted }}>{r.disease}</td>
                  <td className="py-2.5 text-xs font-bold" style={{ color: r.riskLevel === "High" ? C.high : C.moderate }}>{r.riskPercent}%</td>
                  <td className="py-2.5 text-xs" style={{ color: C.textMuted }}>{r.specialistRole}</td>
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
      <h1 className="text-2xl font-extrabold" style={{ color: C.text }}>Global Analytics</h1>
      <div className="flex flex-wrap gap-4">
        <KPICard icon={Users} label="Total Patients" value={db.patients.length} />
        <KPICard icon={ClipboardList} label="Total Screenings" value={db.screenings.length} color={C.accent} />
        <KPICard icon={ClipboardCheck} label="Total Referrals" value={db.referrals.length} color={C.moderate} />
        <KPICard icon={Stethoscope} label="Active Specialists" value={4} color={C.primary} />
      </div>
      <div className="flex flex-wrap gap-5">
        <DiseaseDonut referrals={db.referrals} diseases={DISEASES} />
        <DiseaseDistribution screenings={db.screenings} diseases={DISEASES} />
      </div>
      <RiskTrend screenings={db.screenings} diseases={DISEASES} />
    </div>
  );
}
