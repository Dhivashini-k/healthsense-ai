import React, { useState } from 'react';
import { AlertTriangle, UserPlus, ClipboardCheck, FlaskConical, Eye, CheckCircle } from 'lucide-react';
import { C, ROLE_DISEASES } from '../../utils/constants';
import { KPICard } from '../Common/KPICard';
import { Card } from '../Common/Card';
import { Modal } from '../Common/Modal';
import { EmptyState } from '../Common/EmptyState';
import { RiskBadge } from '../Common/RiskBadge';
import { StatusBadge } from '../Common/StatusBadge';
import { DiseaseDonut } from '../Charts/DiseaseDonut';
import { RiskTrend } from '../Charts/RiskTrend';
import { ReferralReview } from './ReferralReview';
import { LabTestsView } from './LabTestsView';

export function SpecialistArea({ role, tab, db, persist, showToast }) {
  const diseases = ROLE_DISEASES[role];
  const myRefs = db.referrals.filter((r) => diseases.includes(r.disease));
  const [reviewing, setReviewing] = useState(null);
  const [modal, setModal] = useState(null);

  const highRisk = myRefs.filter((r) => r.riskLevel === "High");
  const today = myRefs.filter((r) => r.createdAt === new Date().toISOString().slice(0, 10));
  const pending = myRefs.filter((r) => r.status !== "Signed");
  const scheduled = myRefs.filter((r) => r.labTests.length > 0);
  const patientName = (id) => db.patients.find((p) => p.id === id)?.name || "Unknown";

  const markSeen = async (refId) => {
    const updatedRefs = db.referrals.map((r) => (r.id === refId ? { ...r, isSeen: true, status: r.status === "Draft" ? "Viewed" : r.status } : r));
    const updatedNotifs = db.notifications.map((n) => (n.role === role ? { ...n, read: true } : n));
    await persist({ ...db, referrals: updatedRefs, notifications: updatedNotifs });
  };

  const openReview = async (r) => {
    await markSeen(r.id);
    setReviewing({ ...r, isSeen: true, status: r.status === "Draft" ? "Viewed" : r.status });
  };

  const signReport = async (r, labTests) => {
    const next = {
      ...db,
      referrals: db.referrals.map((x) => (x.id === r.id ? { ...x, status: "Signed", isSeen: true, labTests, signedAt: new Date().toISOString().slice(0, 10) } : x)),
      notifications: [...db.notifications, { id: `nt-${Date.now()}`, role: "Nurse", message: `${role} signed off ${patientName(r.patientId)}'s ${r.disease} report`, createdAt: new Date().toISOString().slice(0, 10), read: false }],
    };
    await persist(next);
    setReviewing(null);
    showToast("Report signed & saved");
  };

  if (tab === "labs") return <LabTestsView db={db} scopeRole={role} />;
  if (tab === "referrals" || reviewing) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold text-brand-text">Referrals — {diseases.join(" & ")}</h1>
        <Card className="p-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-brand-faint">
              <th className="pb-2">Patient</th><th className="pb-2">Disease</th><th className="pb-2">Risk %</th><th className="pb-2">Level</th><th className="pb-2">Seen Status</th><th className="pb-2">Status</th><th className="pb-2">Action</th>
            </tr></thead>
            <tbody>
              {myRefs.slice().reverse().map((r) => (
                <tr key={r.id} className={`border-t border-brand-border ${!r.isSeen && r.riskLevel === 'High' ? 'bg-red-50/50' : ''} hover:bg-slate-50 transition-colors`}>
                  <td className="py-2.5 font-semibold text-brand-text">
                    {patientName(r.patientId)}
                    {!r.isSeen && r.riskLevel === "High" && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full animate-pulse">EMERGENCY</span>
                    )}
                  </td>
                  <td className="py-2.5 text-xs text-brand-muted">{r.disease}</td>
                  <td className={`py-2.5 font-bold text-xs ${r.riskLevel === 'High' ? 'text-brand-high' : 'text-brand-moderate'}`}>{r.riskPercent}%</td>
                  <td className="py-2.5"><RiskBadge level={r.riskLevel} /></td>
                  <td className="py-2.5 text-xs font-semibold">
                    {r.isSeen ? (
                      <span className="text-emerald-600 flex items-center gap-1"><CheckCircle size={14} /> Seen</span>
                    ) : (
                      <span className="text-amber-600 font-bold">Unseen</span>
                    )}
                  </td>
                  <td className="py-2.5"><StatusBadge status={r.status} /></td>
                  <td className="py-2.5"><button onClick={() => openReview(r)} className="text-xs font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200"><Eye size={13} /> View & Sign</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {myRefs.length === 0 && <EmptyState text="No referrals received yet" />}
        </Card>
        {reviewing && <ReferralReview db={db} referral={reviewing} onClose={() => setReviewing(null)} onSign={signReport} onMarkSeen={markSeen} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold text-brand-text">{role} Dashboard</h1>
      <div className="flex flex-wrap gap-4">
        <KPICard icon={AlertTriangle} label="High Risk Cases" value={highRisk.length} color={C.high} onClick={() => setModal("high")} />
        <KPICard icon={UserPlus} label="New Today" value={today.length} color={C.accent} onClick={() => setModal("today")} />
        <KPICard icon={ClipboardCheck} label="Pending Review" value={pending.length} color={C.moderate} onClick={() => setModal("pending")} />
        <KPICard icon={FlaskConical} label="Lab Tests Ordered" value={scheduled.length} color={C.primary} onClick={() => setModal("labs")} />
      </div>
      <div className="flex flex-wrap gap-5">
        <DiseaseDonut referrals={myRefs} diseases={diseases} />
        <RiskTrend screenings={db.screenings} diseases={diseases} />
      </div>

      {modal && (
        <Modal title={modal === "high" ? "High Risk Cases" : modal === "today" ? "New Today" : modal === "pending" ? "Pending Review" : "Lab Test Orders"} onClose={() => setModal(null)} wide>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-brand-faint"><th className="pb-2">Patient</th><th className="pb-2">Disease</th><th className="pb-2">Risk %</th><th className="pb-2">Status</th><th className="pb-2">Action</th></tr></thead>
            <tbody>
              {(modal === "high" ? highRisk : modal === "today" ? today : modal === "pending" ? pending : scheduled).map((r) => (
                <tr key={r.id} className="border-t border-brand-border">
                  <td className="py-2 font-semibold text-brand-text">{patientName(r.patientId)}</td>
                  <td className="py-2 text-xs text-brand-muted">{r.disease}</td>
                  <td className={`py-2 text-xs font-bold ${r.riskLevel === 'High' ? 'text-brand-high' : 'text-brand-moderate'}`}>{r.riskPercent}%</td>
                  <td className="py-2"><StatusBadge status={r.status} /></td>
                  <td className="py-2"><button onClick={() => { setModal(null); openReview(r); }} className="text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-800 rounded-lg">Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
    </div>
  );
}
