import React, { useState, useEffect } from 'react';
import { CheckCircle2, Download, AlertTriangle, CheckCircle, FileText, HeartPulse, Eye } from 'lucide-react';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { RiskBadge } from '../Common/RiskBadge';
import { StatusBadge } from '../Common/StatusBadge';
import { LAB_TESTS_MAP } from '../../utils/constants';
import { fmtDate, printPDFReport } from '../../utils/helpers';

export function ReferralReview({ db, referral, onClose, onSign, onMarkSeen }) {
  const patient = db.patients.find((p) => p.id === referral.patientId);
  const screening = db.screenings.find((s) => s.id === referral.screeningId);
  const [labTests, setLabTests] = useState(referral.labTests?.length ? referral.labTests : []);
  const toggle = (t) => setLabTests((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  const signed = referral.status === "Signed";

  useEffect(() => {
    if (onMarkSeen && !referral.isSeen) {
      onMarkSeen(referral.id);
    }
  }, [referral.id, referral.isSeen, onMarkSeen]);

  const handleDownloadDoctorReport = () => {
    const html = `
      <div class="section">
        <div class="section-title">Specialist Clinical Review & Referral Summary</div>
        <p style="font-size:13px; margin:3px 0;"><b>Specialist Role:</b> ${referral.specialistRole}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Disease Flag:</b> ${referral.disease}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Risk Score:</b> ${referral.riskPercent}% [<span class="badge badge-${referral.riskLevel.toLowerCase()}">${referral.riskLevel}</span>]</p>
        <p style="font-size:13px; margin:3px 0;"><b>Status:</b> ${referral.status}</p>
      </div>

      <div class="section">
        <div class="section-title">Patient Demographics</div>
        <p style="font-size:13px; margin:3px 0;"><b>Patient Name:</b> ${patient?.name}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Age / Gender:</b> ${patient?.age} yrs / ${patient?.gender}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Contact:</b> ${patient?.phone} | <b>Address:</b> ${patient?.address}</p>
      </div>

      <div class="section">
        <div class="section-title">Screening Clinical Vitals & Symptoms</div>
        <p style="font-size:13px; margin:3px 0;"><b>Blood Pressure:</b> ${screening?.vitals.systolic}/${screening?.vitals.diastolic} mmHg</p>
        <p style="font-size:13px; margin:3px 0;"><b>Heart Rate:</b> ${screening?.vitals.heartRate} bpm | <b>BMI:</b> ${screening?.vitals.bmi}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Reported Symptoms:</b> ${screening?.symptoms?.join(', ') || 'None'}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Nurse Screening Notes:</b> ${screening?.notes || 'None'}</p>
      </div>

      <div class="section">
        <div class="section-title">Attached Diagnostic Scan Reports</div>
        <p style="font-size:13px; margin:3px 0;"><b>ECG Report File:</b> ${screening?.files?.ecgFileName || 'ecg_trace_report.pdf'} — <b>Finding:</b> ${screening?.files?.ecgStatus || 'Normal'}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Retinal Fundus Scan File:</b> ${screening?.files?.retinalFileName || 'fundus_retinal_scan.png'} — <b>Finding:</b> ${screening?.files?.retinalStatus || 'Normal'}</p>
      </div>

      <div class="section">
        <div class="section-title">Prescribed Lab Tests & Orders</div>
        ${labTests.length > 0 
          ? `<ul>${labTests.map(t => `<li>${t}</li>`).join('')}</ul>`
          : '<p style="font-size:13px; color:#5C7069;">No additional diagnostic lab tests requested yet.</p>'
        }
      </div>
    `;

    printPDFReport(`Specialist_Review_${patient?.name}_${referral.disease}`, html);
  };

  return (
    <Modal title={`Doctor Referral Review — ${patient?.name}`} onClose={onClose} wide>
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          {referral.riskLevel === "High" && (
            <div className="p-3 rounded-xl bg-red-100 border border-red-200 text-red-900 mb-4 text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-600 shrink-0" />
              <span>THIS IS EMERGENCY: High Risk ({referral.riskPercent}%) patient requiring immediate clinical sign-off!</span>
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold uppercase tracking-wide" style={{ color: '#8CA098' }}>Patient Details</div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
              <CheckCircle size={13} /> Seen / Visited
            </span>
          </div>

          <div className="text-sm space-y-1 mb-4" style={{ color: '#122420' }}>
            <div><b>{patient?.name}</b> · {patient?.age}y · {patient?.gender}</div>
            <div className="text-xs" style={{ color: '#5C7069' }}>{patient?.phone} · {patient?.address}</div>
          </div>

          <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#8CA098' }}>Escalated Risk Report</div>
          <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: referral.riskLevel === 'High' ? '#FBE9E9' : '#FDF3E0' }}>
            <div className="text-sm font-bold" style={{ color: '#122420' }}>{referral.disease}</div>
            <div className="text-2xl font-extrabold" style={{ color: referral.riskLevel === 'High' ? '#D64545' : '#C67C0E' }}>{referral.riskPercent}%</div>
            <RiskBadge level={referral.riskLevel} />
          </div>

          <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#8CA098' }}>Nurse Screening & Diagnostic Vitals</div>
          <div className="text-xs space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200" style={{ color: '#5C7069' }}>
            <div><b>BP:</b> {screening?.vitals.systolic}/{screening?.vitals.diastolic} mmHg · <b>BMI:</b> {screening?.vitals.bmi} · <b>HR:</b> {screening?.vitals.heartRate} bpm</div>
            <div><b>Lifestyle:</b> {screening?.lifestyle.smoking} smoking, {screening?.lifestyle.activity} activity</div>
            <div><b>Symptoms:</b> {screening?.symptoms.join(", ") || "None"}</div>
            {screening?.notes && <div className="italic text-slate-700">"<b>Notes:</b> {screening.notes}"</div>}

            <div className="pt-2 border-t space-y-1.5" style={{ borderColor: '#DEE9E4' }}>
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <HeartPulse size={14} className="text-red-500" /> ECG Report: <span className="font-normal text-slate-700">{screening?.files?.ecgFileName || 'ecg_report.pdf'} ({screening?.files?.ecgStatus || 'Normal'})</span>
              </div>
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Eye size={14} className="text-blue-500" /> Retinal Scan Report: <span className="font-normal text-slate-700">{screening?.files?.retinalFileName || 'retina_scan.png'} ({screening?.files?.retinalStatus || 'Normal'})</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={handleDownloadDoctorReport} variant="outline" className="w-full justify-center text-xs">
              <Download size={14} /> Download Full Medical PDF Report
            </Button>
          </div>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#8CA098' }}>Order Diagnostic Lab Tests</div>
          <div className="space-y-2 mb-5">
            {LAB_TESTS_MAP[referral.disease].map((t) => (
              <label key={t} className="flex items-center gap-2 p-2.5 rounded-lg border text-sm cursor-pointer" style={{ borderColor: '#DEE9E4', opacity: signed ? 0.7 : 1 }}>
                <input type="checkbox" disabled={signed} checked={labTests.includes(t)} onChange={() => toggle(t)} /> {t}
              </label>
            ))}
          </div>

          {signed ? (
            <div className="p-3 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: '#E9F8EF', color: '#1E9E5A' }}>
              <CheckCircle2 size={16} /> Signed off on {fmtDate(referral.signedAt)}
            </div>
          ) : (
            <Button className="w-full justify-center py-3 text-base" onClick={() => onSign(referral, labTests)}>
              <CheckCircle2 size={18} /> Approve & Sign Off Referral
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
