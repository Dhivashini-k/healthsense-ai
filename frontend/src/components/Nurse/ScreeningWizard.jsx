import React, { useState } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, CheckCircle2, Download, AlertTriangle, FileText, Eye, HeartPulse, Info } from 'lucide-react';
import { C, DISEASES, SPECIALIST_MAP, SYMPTOM_LIST, STEPS } from '../../utils/constants';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Field } from '../Common/Field';
import { RiskBadge } from '../Common/RiskBadge';
import { classify, computeBMI, uid, todayStr, printPDFReport, fmtDate } from '../../utils/helpers';
import { computeRisk } from '../../utils/riskCalculator';
import { LowRiskActions } from './LowRiskActions';
import RiskGauge from '../Charts/RiskGauge';
import FeatureContributionChart from '../Charts/FeatureContributionChart';
import { personalSchema, vitalsSchema, getVitalWarnings, validateAll } from '../../utils/validationSchemas';

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
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [processingState, setProcessingState] = useState(null); // null, 0, 1, 2, 3 (done)
  const [pendingResult, setPendingResult] = useState(null);

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
    setPendingResult({ screening, referrals: newReferrals });
    setProcessingState(0);
    
    // Simulate backend processing
    setTimeout(() => setProcessingState(1), 1000);
    setTimeout(() => setProcessingState(2), 2500);
    setTimeout(() => setProcessingState(3), 4000);
  };

  const finalizeScreening = () => {
    setResult(pendingResult);
    setProcessingState(null);
    showToast(pendingResult.referrals.length ? "Screening completed & escalated to Doctor dashboard" : "Screening saved");
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

  // ── Validation Logic ────────────────────────────────────────────────
  const validateStep = (stepIndex) => {
    if (stepIndex === 1) {
      const result = validateAll(personalSchema, { height: +personal.height, weight: +personal.weight });
      setErrors(result.errors);
      return result.valid;
    }
    if (stepIndex === 4) {
      const result = validateAll(vitalsSchema, { systolic: +vitals.systolic, diastolic: +vitals.diastolic, heartRate: +vitals.heartRate });
      setErrors(result.errors);
      if (result.valid) {
        setWarnings(getVitalWarnings(vitals));
      }
      return result.valid;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setErrors({});
      setStep((s) => s + 1);
    }
  };

  const canNext = [!!patientId, personal.height && personal.weight, true, true, vitals.systolic && vitals.diastolic && vitals.heartRate, true, true][step];

  if (result) {
    const isAllLow = result.referrals.length === 0;
    const sortedDiseases = DISEASES.map(d => ({ name: d, score: result.screening.riskScores[d] })).sort((a, b) => b.score - a.score);
    const primaryDisease = sortedDiseases[0];

    return (
      <div className="max-w-4xl mx-auto flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={22} className="text-brand-accent" />
            <h1 className="text-xl font-extrabold text-brand-text">AI Risk Report — {patient.name}</h1>
          </div>
          <Button onClick={downloadFullReport} variant="outline" className="text-xs">
            <Download size={15} /> Download Full Medical PDF Report
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <Card className="p-6 flex flex-col items-center justify-center text-center">
            <h3 className="font-bold text-slate-800 mb-2">Primary AI Risk Assessment</h3>
            <p className="text-sm text-slate-500 mb-4">{primaryDisease.name} Screening Result</p>
            <RiskGauge score={primaryDisease.score} />
            <div className="mt-6 w-full text-left">
              <FeatureContributionChart 
                disease={primaryDisease.name} 
                formData={{...result.screening.personal, ...result.screening.vitals, ...result.screening.lifestyle, familyHistory: Object.keys(result.screening.family).filter(k => result.screening.family[k]), age: patient.age }} 
                modelExplanations={result.screening.explanations} 
              />
            </div>
          </Card>
          
          <div className="flex flex-col gap-4">
            <Card className="p-5 flex-1">
              <h3 className="font-bold text-slate-800 mb-4 text-sm">Multi-Disease Summary</h3>
              <div className="space-y-4">
                {sortedDiseases.map((d) => {
                  const level = classify(d.score);
                  return (
                    <div key={d.name} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-700">{d.name}</span>
                        <RiskBadge level={level} />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${level === "High" ? 'bg-brand-high' : level === "Moderate" ? 'bg-brand-moderate' : 'bg-brand-low'}`}
                            style={{ 
                              width: `${d.score}%` 
                            }} 
                          />
                        </div>
                        <span className={`text-xs font-bold w-8 text-right ${level === "High" ? 'text-brand-high' : level === "Moderate" ? 'text-brand-moderate' : 'text-brand-low'}`}>
                          {d.score}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
            
            <Card className="p-4 bg-slate-50 border-slate-200">
              <h3 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-1.5"><HeartPulse size={16} className="text-slate-600"/> Clinical Notes & Scans</h3>
              <div className="space-y-2 text-xs">
                {result.screening.files?.ecgStatus && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">ECG:</span>
                    <span className="font-semibold text-slate-800">{result.screening.files.ecgStatus}</span>
                  </div>
                )}
                {result.screening.files?.retinalStatus && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Retinal Scan:</span>
                    <span className="font-semibold text-slate-800">{result.screening.files.retinalStatus}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Vitals:</span>
                  <span className="font-semibold text-slate-800">{result.screening.vitals.systolic}/{result.screening.vitals.diastolic} mmHg, {result.screening.vitals.heartRate} bpm</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {isAllLow ? (
          <LowRiskActions patient={patient} screening={result.screening} />
        ) : (
          <Card className="p-5 bg-brand-moderate-bg">
            <div className="font-bold text-sm mb-2 flex items-center gap-2 text-brand-text">
              <AlertTriangle size={18} className="text-amber-600" /> Specialist Referral Escalated
            </div>
            <p className="text-xs mb-3 text-amber-900">
              The high/moderate risk parameters & scan reports have been transmitted to the doctor's dashboard. For High-Risk cases, automatic 5-minute emergency reminders will be issued until reviewed.
            </p>
            {result.referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-t border-brand-border/10 first:border-0">
                <div className="text-sm text-brand-text"><b>{r.disease}</b> ({r.riskPercent}%) → Assigned to <b>{r.specialistRole}</b></div>
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
      <h1 className="text-xl font-extrabold text-brand-text">Clinical Assessment Engine</h1>
      <div className="flex items-center gap-1 flex-wrap">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= step ? 'bg-brand-primary text-white' : 'bg-brand-border text-brand-faint'}`}>{i + 1}</div>
            {i < STEPS.length - 1 && <div className={`w-6 h-0.5 ${i < step ? 'bg-brand-primary' : 'bg-brand-border'}`} />}
          </div>
        ))}
      </div>
      <Card className="p-6">
        <div className="font-bold mb-4 text-brand-text">{STEPS[step]}</div>

        {step === 0 && (
          <Field label="Select Registered Patient (Unscreened Only)">
            <select className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm outline-none bg-white focus:border-brand-primary" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
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
            <Field label="Height (cm)">
              <input type="number" className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-brand-primary ${errors.height ? 'border-red-400 bg-red-50' : 'border-brand-border'}`} value={personal.height} onChange={(e) => { setPersonal({ ...personal, height: e.target.value }); if (errors.height) setErrors(prev => ({...prev, height: undefined})); }} placeholder="e.g. 168" />
              {errors.height && <div className="text-xs text-red-600 mt-1 font-medium">{errors.height}</div>}
            </Field>
            <Field label="Weight (kg)">
              <input type="number" className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-brand-primary ${errors.weight ? 'border-red-400 bg-red-50' : 'border-brand-border'}`} value={personal.weight} onChange={(e) => { setPersonal({ ...personal, weight: e.target.value }); if (errors.weight) setErrors(prev => ({...prev, weight: undefined})); }} placeholder="e.g. 72" />
              {errors.weight && <div className="text-xs text-red-600 mt-1 font-medium">{errors.weight}</div>}
            </Field>
            {bmi > 0 && (
              <div className={`text-xs flex items-center gap-1 ${bmi >= 30 ? 'text-brand-high' : bmi >= 25 ? 'text-brand-moderate' : 'text-brand-low'}`}>
                BMI: <b>{bmi}</b> — {bmi >= 30 ? 'Obese' : bmi >= 25 ? 'Overweight' : bmi >= 18.5 ? 'Normal' : 'Underweight'}
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Smoking"><select className="w-full px-3 py-2 rounded-lg border border-brand-border focus:border-brand-primary text-sm outline-none bg-white" value={lifestyle.smoking} onChange={(e) => setLifestyle({ ...lifestyle, smoking: e.target.value })}><option>None</option><option>Occasional</option><option>Regular</option></select></Field>
            <Field label="Alcohol"><select className="w-full px-3 py-2 rounded-lg border border-brand-border focus:border-brand-primary text-sm outline-none bg-white" value={lifestyle.alcohol} onChange={(e) => setLifestyle({ ...lifestyle, alcohol: e.target.value })}><option>None</option><option>Occasional</option><option>Regular</option></select></Field>
            <Field label="Activity"><select className="w-full px-3 py-2 rounded-lg border border-brand-border focus:border-brand-primary text-sm outline-none bg-white" value={lifestyle.activity} onChange={(e) => setLifestyle({ ...lifestyle, activity: e.target.value })}><option>Low</option><option>Moderate</option><option>High</option></select></Field>
            <Field label="Diet"><select className="w-full px-3 py-2 rounded-lg border border-brand-border focus:border-brand-primary text-sm outline-none bg-white" value={lifestyle.diet} onChange={(e) => setLifestyle({ ...lifestyle, diet: e.target.value })}><option>Poor</option><option>Average</option><option>Good</option></select></Field>
            <Field label="Sleep (hrs)"><input type="number" className="w-full px-3 py-2 rounded-lg border border-brand-border focus:border-brand-primary text-sm outline-none" value={lifestyle.sleep} onChange={(e) => setLifestyle({ ...lifestyle, sleep: +e.target.value })} /></Field>
            <Field label="Stress"><select className="w-full px-3 py-2 rounded-lg border border-brand-border focus:border-brand-primary text-sm outline-none bg-white" value={lifestyle.stress} onChange={(e) => setLifestyle({ ...lifestyle, stress: e.target.value })}><option>Low</option><option>Moderate</option><option>High</option></select></Field>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-2 gap-3">
            {["diabetes", "hypertension", "heartDisease", "stroke", "ckd"].map((k) => (
              <label key={k} className="flex items-center gap-2 p-3 rounded-lg border border-brand-border text-sm cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="checkbox" checked={family[k]} onChange={(e) => setFamily({ ...family, [k]: e.target.checked })} className="accent-brand-primary" />
                {k === "heartDisease" ? "Heart Disease" : k === "ckd" ? "CKD" : k[0].toUpperCase() + k.slice(1)}
              </label>
            ))}
          </div>
        )}

        {step === 4 && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Systolic (mmHg)">
                <input type="number" className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-brand-primary ${errors.systolic ? 'border-red-400 bg-red-50' : 'border-brand-border'}`} value={vitals.systolic} onChange={(e) => { setVitals({ ...vitals, systolic: e.target.value }); if (errors.systolic) setErrors(prev => ({...prev, systolic: undefined})); }} placeholder="e.g. 120" />
                {errors.systolic && <div className="text-xs text-red-600 mt-1 font-medium">{errors.systolic}</div>}
              </Field>
              <Field label="Diastolic (mmHg)">
                <input type="number" className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-brand-primary ${errors.diastolic ? 'border-red-400 bg-red-50' : 'border-brand-border'}`} value={vitals.diastolic} onChange={(e) => { setVitals({ ...vitals, diastolic: e.target.value }); if (errors.diastolic) setErrors(prev => ({...prev, diastolic: undefined})); }} placeholder="e.g. 80" />
                {errors.diastolic && <div className="text-xs text-red-600 mt-1 font-medium">{errors.diastolic}</div>}
              </Field>
              <Field label="Heart Rate (bpm)">
                <input type="number" className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-brand-primary ${errors.heartRate ? 'border-red-400 bg-red-50' : 'border-brand-border'}`} value={vitals.heartRate} onChange={(e) => { setVitals({ ...vitals, heartRate: e.target.value }); if (errors.heartRate) setErrors(prev => ({...prev, heartRate: undefined})); }} placeholder="e.g. 72" />
                {errors.heartRate && <div className="text-xs text-red-600 mt-1 font-medium">{errors.heartRate}</div>}
              </Field>
            </div>
            {(warnings.systolic || warnings.diastolic || warnings.heartRate) && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                {warnings.systolic && <div className="text-xs text-amber-800 font-medium flex items-center gap-1.5"><Info size={13} className="text-amber-600 shrink-0" />{warnings.systolic}</div>}
                {warnings.diastolic && <div className="text-xs text-amber-800 font-medium flex items-center gap-1.5"><Info size={13} className="text-amber-600 shrink-0" />{warnings.diastolic}</div>}
                {warnings.heartRate && <div className="text-xs text-amber-800 font-medium flex items-center gap-1.5"><Info size={13} className="text-amber-600 shrink-0" />{warnings.heartRate}</div>}
              </div>
            )}
          </>
        )}

        {step === 5 && (
          <div className="space-y-5">
            {/* ECG Scan Upload Card */}
            <div className="p-4 rounded-xl border border-brand-border bg-slate-50">
              <div className="font-bold text-sm mb-3 flex items-center gap-2 text-brand-text">
                <HeartPulse size={18} className="text-red-500" /> ECG Scan Report Upload & Assessment
              </div>
              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-xs font-semibold mb-1 text-slate-600">Upload ECG Report File (PDF / Image)</div>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleEcgFileChange}
                    className="w-full text-xs p-2 rounded-lg border border-brand-border bg-white"
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
                    className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm bg-white focus:border-brand-primary outline-none"
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
                  className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm bg-white outline-none focus:border-brand-primary"
                />
              </Field>
            </div>

            {/* Retinal Scan Upload Card */}
            <div className="p-4 rounded-xl border border-brand-border bg-slate-50">
              <div className="font-bold text-sm mb-3 flex items-center gap-2 text-brand-text">
                <Eye size={18} className="text-blue-500" /> Retinal Scan Report Upload & Assessment
              </div>
              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-xs font-semibold mb-1 text-slate-600">Upload Retinal Fundus Scan (PDF / Image)</div>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleRetinalFileChange}
                    className="w-full text-xs p-2 rounded-lg border border-brand-border bg-white"
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
                    className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm bg-white focus:border-brand-primary outline-none"
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
                  className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm bg-white outline-none focus:border-brand-primary"
                />
              </Field>
            </div>
          </div>
        )}

        {step === 6 && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {SYMPTOM_LIST.map((s) => (
                <label key={s} className="flex items-center gap-2 p-3 rounded-lg border border-brand-border text-sm cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="checkbox" checked={symptoms.includes(s)} onChange={() => toggleSymptom(s)} className="accent-brand-primary" /> {s}
                </label>
              ))}
            </div>
            <Field label="Nurse Notes"><textarea className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm outline-none focus:border-brand-primary" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional observations..." /></Field>
          </>
        )}

        {step === 7 && (
          <div className="text-center py-6">
            <Sparkles size={30} className="mx-auto mb-3 text-brand-accent" />
            <p className="text-sm mb-4 text-brand-muted">Ready to run AI risk prediction for <b>{patient?.name}</b></p>
            <Button onClick={runScreening} disabled={processingState !== null}><Sparkles size={16} /> Screen & Generate Report</Button>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="ghost" onClick={() => { setStep((s) => Math.max(0, s - 1)); setErrors({}); setWarnings({}); }} disabled={step === 0 || processingState !== null}><ChevronLeft size={16} /> Back</Button>
          {step < STEPS.length - 1 && <Button onClick={handleNext} disabled={!canNext || processingState !== null}>Next <ChevronRight size={16} /></Button>}
        </div>
      </Card>

      {/* Processing Modal */}
      {processingState !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center transform transition-all">
            {processingState < 3 ? (
              <>
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <HeartPulse size={24} className="text-emerald-500 animate-pulse" />
                  </div>
                </div>
                <h3 className="font-extrabold text-lg text-slate-800 mb-1">AI Screening in Progress</h3>
                <p className="text-xs text-slate-500 mb-5">Patient: {patient?.name}</p>
                <div className="w-full text-left space-y-2 mb-5">
                  {["Patient information validated", "Clinical data processed", "Analysing screening signals", "Running disease risk models", "Generating risk summary"].map((label, index) => (
                    <div key={label} className={`flex items-center gap-2 text-xs ${index <= processingState + 1 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                      {index <= processingState + 1 ? <CheckCircle2 size={14} /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-300" />}{label}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-500">Please wait while HealthSense processes the clinical data.</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-emerald-600" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-800 mb-2">Screening Complete</h3>
                <p className="text-sm text-slate-500 mb-6">The AI assessment report is ready for review.</p>
                <Button onClick={finalizeScreening} className="w-full justify-center">View Results</Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
