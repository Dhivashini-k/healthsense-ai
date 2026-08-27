import React, { useState } from 'react';
import { Users, ClipboardCheck, AlertTriangle, Bell, UserPlus } from 'lucide-react';
import { C, DISEASES } from '../../utils/constants';
import { Card } from '../Common/Card';
import { KPICard } from '../Common/KPICard';
import { Modal } from '../Common/Modal';
import { EmptyState } from '../Common/EmptyState';
import { RiskBadge } from '../Common/RiskBadge';
import { Button } from '../Common/Button';
import { DiseaseDonut } from '../Charts/DiseaseDonut';
import { RiskTrend } from '../Charts/RiskTrend';
import { DiseaseRiskTrend } from '../Charts/DiseaseRiskTrend';
import { OperationalFunnel } from '../Charts/OperationalFunnel';
import { HighPriorityPatients } from '../Charts/HighPriorityPatients';
import { LabTestsView } from '../Specialist/LabTestsView';
import { ScreeningWizard } from './ScreeningWizard';
import { PatientsView } from './PatientsView';
import { ArchiveView } from './ArchiveView';
import { AddPatientForm } from './AddPatientForm';
import { fmtDate, classify } from '../../utils/helpers';

export function NurseArea({ tab, setTab, db, persist, showToast }) {
  const [modal, setModal] = useState(null);
  const patients = db.patients;
  const screenings = db.screenings;
  const referrals = db.referrals;
  const todays = screenings.filter((s) => s.date === new Date().toISOString().slice(0, 10));
  const highRiskRefs = referrals.filter((r) => r.riskLevel === "High");
  const highRiskPatientIds = [...new Set(highRiskRefs.map((r) => r.patientId))];
  const pendingReviews = referrals.filter((r) => r.status !== "Signed");
  const patientName = (id) => patients.find((p) => p.id === id)?.name || "Unknown";

  if (tab === "screening") {
    return <ScreeningWizard db={db} persist={persist} showToast={showToast} onDone={() => setTab("dashboard")} />;
  }
  if (tab === "patients") {
    return <PatientsView db={db} persist={persist} showToast={showToast} />;
  }
  if (tab === "archive") {
    return <ArchiveView db={db} persist={persist} showToast={showToast} />;
  }
  if (tab === "labs") {
    return <LabTestsView db={db} scopeRole="Nurse" persist={persist} showToast={showToast} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-text">Nurse Dashboard</h1>
          <p className="text-sm mt-0.5 text-brand-faint">Screening desk overview and early referral status</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setModal({ type: "addPatient" })}><UserPlus size={16} /> Add New Patient</Button>
          <Button onClick={() => setTab("screening")}>New Screening</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <KPICard icon={Users} label="Total Patients" value={patients.length} sub="All registered patients" onClick={() => setModal({ type: "totalPatients" })} />
        <KPICard icon={ClipboardCheck} label="Today's Screenings" value={todays.length} sub={new Date().toISOString().slice(0, 10)} color={C.accent} onClick={() => setModal({ type: "today" })} />
        <KPICard icon={AlertTriangle} label="High Risk Cases" value={highRiskPatientIds.length} sub={`${highRiskRefs.length} disease flags`} color={C.high} onClick={() => setModal({ type: "highRisk" })} />
        <KPICard icon={Bell} label="Pending Doctor Reviews" value={pendingReviews.length} sub="Awaiting specialist sign-off" color={C.moderate} onClick={() => setModal({ type: "pending" })} />
      </div>

      <div className="flex flex-wrap gap-5">
        <DiseaseRiskTrend screenings={screenings} diseases={DISEASES} />
        <OperationalFunnel screenings={screenings} referrals={referrals} />
      </div>

      <HighPriorityPatients referrals={referrals} patients={patients} />

      {modal?.type === "totalPatients" && (
        <Modal title="All Patients" onClose={() => setModal(null)} wide>
          <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
            {patients.map((p) => (
              <div key={p.id} className="p-3 rounded-xl border border-brand-border">
                <div className="font-bold text-sm text-brand-text">{p.name}</div>
                <div className="text-xs mt-1 text-brand-muted">{p.age}y · {p.gender} · {p.phone}</div>
                <div className="text-xs mt-1 text-brand-faint">{p.address}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
      {modal?.type === "today" && (
        <Modal title="Today's Screenings" onClose={() => setModal(null)} wide>
          {todays.length === 0 ? <EmptyState text="No screenings performed today" /> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-brand-faint"><th className="pb-2">Patient</th><th className="pb-2">Risk Status</th></tr></thead>
              <tbody>
                {todays.map((s) => {
                  const top = Object.entries(s.riskScores).sort((a, b) => b[1] - a[1])[0];
                  return (
                    <tr key={s.id} className="border-t border-brand-border">
                      <td className="py-2 font-semibold text-brand-text">{patientName(s.patientId)}</td>
                      <td className="py-2"><RiskBadge level={classify(top[1])} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Modal>
      )}
      {modal?.type === "highRisk" && (
        <Modal title="High Risk Patients" onClose={() => setModal(null)} wide>
          {highRiskRefs.length === 0 ? <EmptyState text="No high risk cases" /> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-brand-faint"><th className="pb-2">Patient</th><th className="pb-2">Disease</th><th className="pb-2">Risk %</th><th className="pb-2">Specialist</th></tr></thead>
              <tbody>
                {highRiskRefs.map((r) => (
                  <tr key={r.id} className="border-t border-brand-border">
                    <td className="py-2 font-semibold text-brand-text">{patientName(r.patientId)}</td>
                    <td className="py-2 text-xs text-brand-muted">{r.disease}</td>
                    <td className="py-2 font-bold text-brand-high">{r.riskPercent}%</td>
                    <td className="py-2 text-xs text-brand-muted">{r.specialistRole}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}
      {modal?.type === "pending" && (
        <Modal title="Pending Doctor Reviews" onClose={() => setModal(null)} wide>
          {pendingReviews.length === 0 ? <EmptyState text="Nothing pending" /> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-brand-faint"><th className="pb-2">Patient</th><th className="pb-2">Disease</th><th className="pb-2">Specialist</th></tr></thead>
              <tbody>
                {pendingReviews.map((r) => (
                  <tr key={r.id} className="border-t border-brand-border">
                    <td className="py-2 font-semibold text-brand-text">{patientName(r.patientId)}</td>
                    <td className="py-2 text-xs text-brand-muted">{r.disease}</td>
                    <td className="py-2 text-xs text-brand-muted">{r.specialistRole}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}
      {modal?.type === "addPatient" && (
        <Modal title="Register New Patient" onClose={() => setModal(null)}>
          <AddPatientForm onSave={async (p) => { await persist({ ...db, patients: [...db.patients, p] }); setModal(null); showToast("Patient registered"); }} />
        </Modal>
      )}
    </div>
  );
}
