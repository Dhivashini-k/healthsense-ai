import React, { useState, useMemo } from 'react';
import { Eye, Send } from 'lucide-react';
import { C, DISEASES } from '../../utils/constants';
import { Card } from '../Common/Card';
import { Modal } from '../Common/Modal';
import { EmptyState } from '../Common/EmptyState';
import { StatusBadge } from '../Common/StatusBadge';
import { RiskBadge } from '../Common/RiskBadge';
import { fmtDate, classify, uid, todayStr } from '../../utils/helpers';

export function ArchiveView({ db, persist, showToast }) {
  const [view, setView] = useState(null);
  const groups = useMemo(() => {
    return db.screenings.map((s) => {
      const patient = db.patients.find((p) => p.id === s.patientId);
      const refs = db.referrals.filter((r) => r.screeningId === s.id);
      const specialists = [...new Set(refs.map((r) => r.specialistRole))];
      let status = "Archived";
      if (refs.length) {
        if (refs.every((r) => r.status === "Signed")) status = "Signed";
        else if (refs.some((r) => r.status === "Viewed")) status = "Viewed";
        else status = "Draft";
      }
      return { screening: s, patient, refs, specialists, status };
    }).reverse();
  }, [db]);

  const sendReminder = async (g) => {
    const notifs = g.specialists.map((role) => ({ id: uid("nt"), role, message: `Reminder: ${g.patient.name}'s report is awaiting review`, createdAt: todayStr(), read: false }));
    await persist({ ...db, notifications: [...db.notifications, ...notifs] });
    showToast("Reminder sent");
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-brand-text">Risk Report Archive</h1>
      <Card className="p-5 overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <thead><tr className="text-left text-brand-faint">
            <th className="pb-2 w-1/5">Patient</th>
            {DISEASES.map((d) => <th key={d} className="pb-2 w-16">{d}</th>)}
            <th className="pb-2 w-1/5">Specialist(s)</th><th className="pb-2 w-24">Date</th><th className="pb-2 w-24">Status</th><th className="pb-2 w-24">Actions</th>
          </tr></thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.screening.id} className="border-t border-brand-border">
                <td className="py-2.5 font-semibold text-brand-text">{g.patient?.name}</td>
                {DISEASES.map((d) => {
                  const val = g.screening.riskScores[d];
                  const level = classify(val);
                  return <td key={d} className={`py-2.5 text-xs font-semibold ${level === 'High' ? 'text-brand-high' : level === 'Moderate' ? 'text-brand-moderate' : 'text-brand-low'}`}>{val}%</td>;
                })}
                <td className="py-2.5 text-xs text-brand-muted">{g.specialists.join(", ") || "—"}</td>
                <td className="py-2.5 text-xs text-brand-faint">{fmtDate(g.screening.date)}</td>
                <td className="py-2.5"><StatusBadge status={g.status} /></td>
                <td className="py-2.5">
                  <div className="flex gap-2">
                    <button onClick={() => setView(g)} className="text-xs font-semibold flex items-center gap-1 text-brand-primary"><Eye size={13} /> View</button>
                    {g.status === "Draft" && (
                      <button onClick={() => sendReminder(g)} className="text-xs font-semibold flex items-center gap-1 text-brand-moderate"><Send size={13} /> Remind</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {groups.length === 0 && <EmptyState text="No reports yet" />}
      </Card>

      {view && (
        <Modal title={`Report — ${view.patient?.name}`} onClose={() => setView(null)}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
            {DISEASES.map((d) => {
              const val = view.screening.riskScores[d];
              const level = classify(val);
              return (
                <div key={d} className={`p-2.5 rounded-lg text-center ${level === 'High' ? 'bg-brand-high-bg' : level === 'Moderate' ? 'bg-brand-moderate-bg' : 'bg-brand-low-bg'}`}>
                  <div className="text-[11px] font-semibold text-brand-muted">{d}</div>
                  <div className={`text-lg font-extrabold ${level === 'High' ? 'text-brand-high' : level === 'Moderate' ? 'text-brand-moderate' : 'text-brand-low'}`}>{val}%</div>
                </div>
              );
            })}
          </div>
          {view.refs.length === 0 ? (
            <p className="text-sm text-brand-muted">All markers Low risk — no referral required.</p>
          ) : (
            <div className="space-y-2">
              {view.refs.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg border border-brand-border text-sm">
                  <span>{r.disease} → {r.specialistRole}</span>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
