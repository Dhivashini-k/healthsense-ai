import React, { useState } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, CheckCircle2, Download, AlertTriangle, FileText, Eye, HeartPulse } from 'lucide-react';
import { C, DISEASES, SPECIALIST_MAP, SYMPTOM_LIST, STEPS } from '../../utils/constants';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Field } from '../Common/Field';
import { RiskBadge } from '../Common/RiskBadge';
import { classify, computeBMI, uid, todayStr, printPDFReport, fmtDate } from '../../utils/helpers';
import { computeRisk } from '../../utils/riskCalculator';
import { LowRiskActions } from './LowRiskActions';

export function ScreeningWizard({ db, persist, showToast, onDone }) {
  const [step, setStep] = useState(0);
  const [patientId, setPatientId] = useState("");
  const [personal, setPersonal] = useState({ height: "", weight: "" });
  const [lifestyle, setLifestyle] = useState({ smoking: "None", alcohol: "None", activity: "Moderate", diet: "Average", sleep: 7, stress: "Low" });
  const [family, setFamily] = useState({ diabetes: false, hypertension: false, heartDisease: false, stroke: false, ckd: false });
  const [vitals, setVitals] = useState({ systolic: "", diastolic: "", heartRate: "" });
  const [files, setFiles] = useState({
    ecgFileName: "",
    ecgStatus: "Normal Sinus Rhythm",
    ecgNotes: "",
    retinalFileName: "",
    retinalStatus: "Normal Retina",
    retinalNotes: ""
  });
  const [symptoms, setSymptoms] = useState([]);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState(null);

  const patient = db.patients.find((p) => p.id === patientId);
  const bmi = computeBMI(+personal.height, +personal.weight);

  // Filter out previously screened patients
  const screenedPatientIds = new Set(db.screenings.map((s) => s.patientId));
  const unscreenedPatients = db.patients.filter((p) => !screenedPatientIds.has(p.id));

  const handleEcgFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, ecgFileName: file.name });
    }
  };

  const handleRetinalFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, retinalFileName: file.name });
    }
  };

  const runScreening = async () => {
    const screening = {
      id: uid("scr"), patientId, date: todayStr(),
      personal: { height: +personal.height, weight: +personal.weight },
      lifestyle, family,
      vitals: { systolic: +vitals.systolic, diastolic: +vitals.diastolic, bmi, heartRate: +vitals.heartRate },
      files, symptoms, notes,
    };
    screening.riskScores = computeRisk(screening, patient);
    const newReferrals = [];
    const newNotifs = [];

    DISEASES.forEach((d) => {
      const score = screening.riskScores[d];
      const level = classify(score);
      if (level !== "Low") {
        newReferrals.push({
          id: uid("ref"), screeningId: screening.id, patientId, disease: d, riskPercent: score, riskLevel: level,
          specialistRole: SPECIALIST_MAP[d], status: "Draft", labTests: [], notes: "", createdAt: todayStr(), signedAt: null,
          isSeen: false, emergencyReminderCount: 0
        });
        const isEmergency = level === "High";
        newNotifs.push({
          id: uid("nt"), role: SPECIALIST_MAP[d],
          message: isEmergency 
            ? `THIS IS EMERGENCY: High Risk ${d} (${score}%) for ${patient.name} requires immediate review!`
            : `New ${level} risk ${d} referral for ${patient.name} (${score}%)`,
          createdAt: todayStr(), read: false, isEmergency, patientName: patient.name, disease: d, riskScore: score
        });
      }
    });

    await persist({
      ...db,
      screenings: [...db.screenings, screening],
      referrals: [...db.referrals, ...newReferrals],
      notifications: [...db.notifications, ...newNotifs],
    });
    setResult({ screening, referrals: newReferrals });
    showToast(newReferrals.length ? "Screening completed & escalated to Doctor dashboard" : "Screening saved");
  };

  const downloadFullReport = () => {
    if (!result) return;
    const { screening, referrals } = result;
    const scoresHTML = DISEASES.map((d) => {
      const score = screening.riskScores[d];
      const level = classify(score);
      return `<div style="display:inline-block; margin: 4px; padding: 10px; width: 120px; border: 1px solid #DEE9E4; border-radius: 8px; text-align: center;">
        <div style="font-size:12px; color:#5C7069;"><b>${d}</b></div>
        <div style="font-size:20px; font-weight:bold; color: ${level === 'High' ? '#D64545' : level === 'Moderate' ? '#C67C0E' : '#1E9E5A'}">${score}%</div>
        <span class="badge badge-${level.toLowerCase()}">${level}</span>
      </div>`;
    }).join('');

    const html = `
      <div class="section">
        <div class="section-title">Patient Demographics</div>
        <p style="font-size:13px; margin:3px 0;"><b>Patient Name:</b> ${patient?.name}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Age / Gender:</b> ${patient?.age} yrs / ${patient?.gender}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Contact / Address:</b> ${patient?.phone} | ${patient?.address}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Screening Date:</b> ${fmtDate(screening.date)}</p>
      </div>

      <div class="section">
        <div class="section-title">Vitals & Assessment Data</div>
        <p style="font-size:13px; margin:3px 0;"><b>BP:</b> ${screening.vitals.systolic}/${screening.vitals.diastolic} mmHg | <b>Heart Rate:</b> ${screening.vitals.heartRate} bpm | <b>BMI:</b> ${screening.vitals.bmi}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Symptoms:</b> ${screening.symptoms.join(', ') || 'None reported'}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Nurse Clinical Notes:</b> ${screening.notes || 'None'}</p>
      </div>

      <div class="section">
        <div class="section-title">Diagnostic Scans Attached</div>
        <p style="font-size:13px; margin:3px 0;"><b>ECG Scan Report:</b> ${screening.files?.ecgFileName || 'Attached (Standard ECG)'} — <b>Status:</b> ${screening.files?.ecgStatus || 'Normal'} ${screening.files?.ecgNotes ? `(${screening.files.ecgNotes})` : ''}</p>
        <p style="font-size:13px; margin:3px 0;"><b>Retinal Scan Report:</b> ${screening.files?.retinalFileName || 'Attached (Fundus Scan)'} — <b>Status:</b> ${screening.files?.retinalStatus || 'Normal'} ${screening.files?.retinalNotes ? `(${screening.files.retinalNotes})` : ''}</p>
      </div>

      <div class="section">
        <div class="section-title">AI NCD Risk Breakdown</div>
        ${scoresHTML}
      </div>

      <div class="section">
        <div class="section-title">Specialist Referral Dispatch</div>
        ${referrals.length === 0 
          ? '<p style="font-size:13px; color:#1E9E5A;">Low Risk — No specialist referral required.</p>'
          : referrals.map((r) => `<p style="font-size:13px; margin:4px 0;">• <b>${r.disease}</b> (${r.riskPercent}%) → Sent to <b>${r.specialistRole}</b> [<span style="color:#D64545; font-weight:bold;">${r.riskLevel}</span>]</p>`).join('')
        }
      </div>
    `;

    printPDFReport(`Screening_Report_${patient?.name}`, html);
  };

  const toggleSymptom = (s) => setSymptoms((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  const canNext = [!!patientId, personal.height && personal.weight, true, true, vitals.systolic && vitals.diastolic && vitals.heartRate, true, true][step];

  if (result) {
    const isAllLow = result.referrals.length === 0;
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={22} style={{ color: C.accent }} />
            <h1 className="text-xl font-extrabold" style={{ color: C.text }}>AI Risk Report — {patient.name}</h1>
          </div>
          <Button onClick={downloadFullReport} variant="outline" className="text-xs">
            <Download size={15} /> Download Full Medical PDF Report
          </Button>
        </div>

        <Card className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {DISEASES.map((d) => {
              const score = result.screening.riskScores[d];
              const level = classify(score);
              return (
                <div key={d} className="p-3 rounded-xl text-center" style={{ backgroundColor: level === "Low" ? C.lowBg : level === "Moderate" ? C.moderateBg : C.highBg }}>
                  <div className="text-xs font-semibold" style={{ color: C.textMuted }}>{d}</div>
                  <div className="text-2xl font-extrabold" style={{ color: level === "Low" ? C.low : level === "Moderate" ? C.moderate : C.high }}>{score}%</div>
                  <RiskBadge level={level} />
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t grid md:grid-cols-2 gap-3 text-xs" style={{ borderColor: C.border }}>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-bold flex items-center gap-1.5 text-slate-800"><HeartPulse size={14} className="text-red-500" /> ECG Scan Report</div>
              <div className="text-slate-600 mt-1">File: <b>{result.screening.files?.ecgFileName || 'ecg_trace_report.pdf'}</b></div>
              <div className="text-slate-600">Finding: <span className="font-semibold text-slate-900">{result.screening.files?.ecgStatus}</span></div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-bold flex items-center gap-1.5 text-slate-800"><Eye size={14} className="text-blue-500" /> Retinal Scan Report</div>
              <div className="text-slate-600 mt-1">File: <b>{result.screening.files?.retinalFileName || 'fundus_retinal_scan.png'}</b></div>
              <div className="text-slate-600">Finding: <span className="font-semibold text-slate-900">{result.screening.files?.retinalStatus}</span></div>
            </div>
          </div>
        </Card>

        {isAllLow ? (
          <LowRiskActions patient={patient} screening={result.screening} />
        ) : (
          <Card className="p-5" style={{ backgroundColor: C.moderateBg }}>
            <div className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: C.text }}>
              <AlertTriangle size={18} className="text-amber-600" /> Specialist Referral Escalated
            </div>
            <p className="text-xs mb-3 text-amber-900">
              The high/moderate risk parameters & scan reports have been transmitted to the doctor's dashboard. For High-Risk cases, automatic 5-minute emergency reminders will be issued until reviewed.
            </p>
            {result.referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-t first:border-0" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                <div className="text-sm" style={{ color: C.text }}><b>{r.disease}</b> ({r.riskPercent}%) → Assigned to <b>{r.specialistRole}</b></div>
                <RiskBadge level={r.riskLevel} />
              </div>
            ))}
          </Card>
        )}

        <Button onClick={onDone} className="self-start"><CheckCircle2 size={16} /> Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      <h1 className="text-xl font-extrabold" style={{ color: C.text }}>Clinical Assessment Engine</h1>
      <div className="flex items-center gap-1 flex-wrap">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: i <= step ? C.primary : C.border, color: i <= step ? "#fff" : C.textFaint }}>{i + 1}</div>
            {i < STEPS.length - 1 && <div className="w-6 h-0.5" style={{ backgroundColor: i < step ? C.primary : C.border }} />}
          </div>
        ))}
      </div>
      <Card className="p-6">
        <div className="font-bold mb-4" style={{ color: C.text }}>{STEPS[step]}</div>

        {step === 0 && (
          <Field label="Select Registered Patient (Unscreened Only)">
            <select className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: C.border }} value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              <option value="">— choose unscreened patient —</option>
              {unscreenedPatients.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.age}y · {p.gender}</option>)}
            </select>
            {unscreenedPatients.length === 0 && (
              <div className="text-xs text-amber-900 mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 leading-relaxed">
                <b>All registered patients have already been screened.</b><br/>
                Please register a new patient via the <b>Patients</b> tab or top-right <b>"Add New Patient"</b> button to perform a new screening.
              </div>
            )}
          </Field>
        )}

        {step === 1 && (
          <>
            <Field label="Height (cm)"><input type="number" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: C.border }} value={personal.height} onChange={(e) => setPersonal({ ...personal, height: e.target.value })} /></Field>
            <Field label="Weight (kg)"><input type="number" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: C.border }} value={personal.weight} onChange={(e) => setPersonal({ ...personal, weight: e.target.value })} /></Field>
            {bmi > 0 && <div className="text-xs" style={{ color: C.textMuted }}>BMI: <b>{bmi}</b></div>}
          </>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Smoking"><select className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: C.border }} value={lifestyle.smoking} onChange={(e) => setLifestyle({ ...lifestyle, smoking: e.target.value })}><option>None</option><option>Occasional</option><option>Regular</option></select></Field>
            <Field label="Alcohol"><select className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: C.border }} value={lifestyle.alcohol} onChange={(e) => setLifestyle({ ...lifestyle, alcohol: e.target.value })}><option>None</option><option>Occasional</option><option>Regular</option></select></Field>
            <Field label="Activity"><select className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: C.border }} value={lifestyle.activity} onChange={(e) => setLifestyle({ ...lifestyle, activity: e.target.value })}><option>Low</option><option>Moderate</option><option>High</option></select></Field>
            <Field label="Diet"><select className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: C.border }} value={lifestyle.diet} onChange={(e) => setLifestyle({ ...lifestyle, diet: e.target.value })}><option>Poor</option><option>Average</option><option>Good</option></select></Field>
            <Field label="Sleep (hrs)"><input type="number" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: C.border }} value={lifestyle.sleep} onChange={(e) => setLifestyle({ ...lifestyle, sleep: +e.target.value })} /></Field>
            <Field label="Stress"><select className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: C.border }} value={lifestyle.stress} onChange={(e) => setLifestyle({ ...lifestyle, stress: e.target.value })}><option>Low</option><option>Moderate</option><option>High</option></select></Field>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-2 gap-3">
            {["diabetes", "hypertension", "heartDisease", "stroke", "ckd"].map((k) => (
              <label key={k} className="flex items-center gap-2 p-3 rounded-lg border text-sm cursor-pointer" style={{ borderColor: C.border }}>
                <input type="checkbox" checked={family[k]} onChange={(e) => setFamily({ ...family, [k]: e.target.checked })} />
                {k === "heartDisease" ? "Heart Disease" : k === "ckd" ? "CKD" : k[0].toUpperCase() + k.slice(1)}
              </label>
            ))}
          </div>
        )}

        {step === 4 && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Systolic"><input type="number" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: C.border }} value={vitals.systolic} onChange={(e) => setVitals({ ...vitals, systolic: e.target.value })} /></Field>
              <Field label="Diastolic"><input type="number" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: C.border }} value={vitals.diastolic} onChange={(e) => setVitals({ ...vitals, diastolic: e.target.value })} /></Field>
              <Field label="Heart Rate"><input type="number" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: C.border }} value={vitals.heartRate} onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })} /></Field>
            </div>
          </>
        )}

        {step === 5 && (
          <div className="space-y-5">
            {/* ECG Scan Upload Card */}
            <div className="p-4 rounded-xl border bg-slate-50" style={{ borderColor: C.border }}>
              <div className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: C.text }}>
                <HeartPulse size={18} className="text-red-500" /> ECG Scan Report Upload & Assessment
              </div>
              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-xs font-semibold mb-1 text-slate-600">Upload ECG Report File (PDF / Image)</div>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleEcgFileChange}
                    className="w-full text-xs p-2 rounded-lg border bg-white"
                    style={{ borderColor: C.border }}
                  />
                  {files.ecgFileName && (
                    <div className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                      <FileText size={12} /> Attached: {files.ecgFileName}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold mb-1 text-slate-600">ECG Diagnostic Status</div>
                  <select
                    value={files.ecgStatus}
                    onChange={(e) => setFiles({ ...files, ecgStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-white"
                    style={{ borderColor: C.border }}
                  >
                    <option>Normal Sinus Rhythm</option>
                    <option>Abnormal / Arrhythmia</option>
                    <option>ST Segment Elevation</option>
                    <option>Inconclusive</option>
                  </select>
                </div>
              </div>
              <Field label="ECG Clinical Observations">
                <input
                  type="text"
                  placeholder="e.g. T-wave inversion in Lead II, QT prolongation..."
                  value={files.ecgNotes}
                  onChange={(e) => setFiles({ ...files, ecgNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-white outline-none"
                  style={{ borderColor: C.border }}
                />
              </Field>
            </div>

            {/* Retinal Scan Upload Card */}
            <div className="p-4 rounded-xl border bg-slate-50" style={{ borderColor: C.border }}>
              <div className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: C.text }}>
                <Eye size={18} className="text-blue-500" /> Retinal Scan Report Upload & Assessment
              </div>
              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-xs font-semibold mb-1 text-slate-600">Upload Retinal Fundus Scan (PDF / Image)</div>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleRetinalFileChange}
                    className="w-full text-xs p-2 rounded-lg border bg-white"
                    style={{ borderColor: C.border }}
                  />
                  {files.retinalFileName && (
                    <div className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                      <FileText size={12} /> Attached: {files.retinalFileName}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold mb-1 text-slate-600">Retinal Scan Finding</div>
                  <select
                    value={files.retinalStatus}
                    onChange={(e) => setFiles({ ...files, retinalStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-white"
                    style={{ borderColor: C.border }}
                  >
                    <option>Normal Retina</option>
                    <option>Diabetic Retinopathy (Mild/Moderate)</option>
                    <option>Hypertensive Retinopathy</option>
                    <option>Macular Edema</option>
                  </select>
                </div>
              </div>
              <Field label="Retinal Examination Notes">
                <input
                  type="text"
                  placeholder="e.g. Microaneurysms detected in macular region..."
                  value={files.retinalNotes}
                  onChange={(e) => setFiles({ ...files, retinalNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-white outline-none"
                  style={{ borderColor: C.border }}
                />
              </Field>
            </div>
          </div>
        )}

        {step === 6 && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {SYMPTOM_LIST.map((s) => (
                <label key={s} className="flex items-center gap-2 p-3 rounded-lg border text-sm cursor-pointer" style={{ borderColor: C.border }}>
                  <input type="checkbox" checked={symptoms.includes(s)} onChange={() => toggleSymptom(s)} /> {s}
                </label>
              ))}
            </div>
            <Field label="Nurse Notes"><textarea className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: C.border }} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional observations..." /></Field>
          </>
        )}

        {step === 7 && (
          <div className="text-center py-6">
            <Sparkles size={30} className="mx-auto mb-3" style={{ color: C.accent }} />
            <p className="text-sm mb-4" style={{ color: C.textMuted }}>Ready to run AI risk prediction for <b>{patient?.name}</b></p>
            <Button onClick={runScreening}><Sparkles size={16} /> Screen & Generate Report</Button>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}><ChevronLeft size={16} /> Back</Button>
          {step < STEPS.length - 1 && <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>Next <ChevronRight size={16} /></Button>}
        </div>
      </Card>
    </div>
  );
}
