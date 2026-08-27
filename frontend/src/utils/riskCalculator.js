import { clamp } from './helpers';

/**
 * Deterministic NCD Risk Calculator for Frontend Screening.
 * 
 * Computes estimated risk for Diabetes, Hypertension, CVD, Stroke, and CKD
 * using clinically-grounded rule-based scoring adapted from:
 * - Finnish Diabetes Risk Score (FINDRISC)
 * - AHA/JNC8 Blood Pressure Classification
 * - Framingham Heart Study Risk Model
 * - WHO Stroke Risk Factors
 * - KDIGO CKD Risk Matrix
 * 
 * IMPORTANT: No randomness or jitter. Results are deterministic for the same input.
 * These are screening estimates, NOT clinical diagnoses.
 */

export function computeRisk(screening, patient) {
  const { lifestyle, family, vitals, symptoms, files = {} } = screening;
  const age = +patient.age || 40;
  const bmi = vitals.bmi || 22;
  const sys = vitals.systolic || 118;
  const dia = vitals.diastolic || 78;
  const hr = vitals.heartRate || 76;
  const smoke = lifestyle.smoking === "Regular" ? 2 : lifestyle.smoking === "Occasional" ? 1 : 0;
  const activityLow = lifestyle.activity === "Low" ? 1 : 0;
  const dietPoor = lifestyle.diet === "Poor" ? 1 : lifestyle.diet === "Average" ? 0.5 : 0;
  const stressHigh = lifestyle.stress === "High" ? 1 : lifestyle.stress === "Moderate" ? 0.5 : 0;
  const sym = (s) => (symptoms.includes(s) ? 1 : 0);

  // ECG & Retinal Findings Impact
  const ecgAbnormal = files.ecgStatus && files.ecgStatus !== "Normal Sinus Rhythm";
  const ecgST = files.ecgStatus === "ST Segment Elevation";
  const retinalDiabetic = files.retinalStatus && files.retinalStatus.toLowerCase().includes("diabetic");
  const retinalHypertensive = files.retinalStatus && files.retinalStatus.toLowerCase().includes("hypertensive");

  // ── 1. Diabetes Risk (FINDRISC-adapted) ────────────────────────────
  let diabetesScore = 5;
  // Age contribution
  if (age >= 65) diabetesScore += 18;
  else if (age >= 55) diabetesScore += 14;
  else if (age >= 45) diabetesScore += 10;
  else if (age >= 35) diabetesScore += 5;
  // BMI
  if (bmi >= 35) diabetesScore += 25;
  else if (bmi >= 30) diabetesScore += 18;
  else if (bmi >= 27) diabetesScore += 12;
  else if (bmi >= 25) diabetesScore += 6;
  // Family history
  if (family.diabetes) diabetesScore += 16;
  // Lifestyle
  diabetesScore += dietPoor * 10;
  diabetesScore += activityLow * 10;
  diabetesScore += stressHigh * 4;
  // Symptoms
  diabetesScore += sym("Frequent Urination") * 14;
  diabetesScore += sym("Fatigue") * 5;
  // Retinal findings
  if (retinalDiabetic) diabetesScore += 22;
  const diabetes = clamp(Math.round(diabetesScore * 0.55));

  // ── 2. Hypertension Risk (AHA/JNC8-adapted) ───────────────────────
  let htnScore = 4;
  // Systolic BP (primary driver)
  if (sys >= 180) htnScore += 45;
  else if (sys >= 140) htnScore += 32;
  else if (sys >= 130) htnScore += 18;
  else if (sys >= 120) htnScore += 6;
  // Diastolic BP
  if (dia >= 120) htnScore += 30;
  else if (dia >= 90) htnScore += 20;
  else if (dia >= 80) htnScore += 8;
  // Age
  if (age >= 55) htnScore += 12;
  else if (age >= 45) htnScore += 6;
  // Family history
  if (family.hypertension) htnScore += 16;
  // Lifestyle
  htnScore += smoke * 6;
  htnScore += stressHigh * 8;
  htnScore += dietPoor * 6;
  // Symptoms
  htnScore += sym("Headache") * 8;
  // ECG
  if (ecgAbnormal) htnScore += 8;
  if (retinalHypertensive) htnScore += 18;
  const hypertension = clamp(Math.round(htnScore * 0.52));

  // ── 3. CVD Risk (Framingham-adapted) ──────────────────────────────
  let cvdScore = 4;
  // Age + gender
  if (age >= 65) cvdScore += 22;
  else if (age >= 55) cvdScore += 16;
  else if (age >= 45) cvdScore += 10;
  else if (age >= 35) cvdScore += 5;
  // Blood pressure
  if (sys >= 160) cvdScore += 24;
  else if (sys >= 140) cvdScore += 18;
  else if (sys >= 130) cvdScore += 10;
  else if (sys >= 120) cvdScore += 4;
  // Smoking (strongest CVD risk factor)
  cvdScore += smoke * 10;
  // Family history
  if (family.heartDisease) cvdScore += 16;
  // BMI
  if (bmi >= 30) cvdScore += 10;
  else if (bmi >= 27) cvdScore += 5;
  // Activity
  cvdScore += activityLow * 8;
  cvdScore += dietPoor * 6;
  // Symptoms
  cvdScore += sym("Chest Pain") * 22;
  cvdScore += sym("Breathlessness") * 14;
  // ECG
  if (ecgST) cvdScore += 26;
  else if (ecgAbnormal) cvdScore += 16;
  const cvd = clamp(Math.round(cvdScore * 0.50));

  // ── 4. Stroke Risk (WHO-adapted) ──────────────────────────────────
  let strokeScore = 4;
  // Age (strongest predictor)
  if (age >= 65) strokeScore += 24;
  else if (age >= 55) strokeScore += 16;
  else if (age >= 45) strokeScore += 8;
  // Blood pressure (primary modifiable risk)
  if (sys >= 160) strokeScore += 28;
  else if (sys >= 140) strokeScore += 20;
  else if (sys >= 130) strokeScore += 10;
  // Heart rate abnormality (AFib proxy)
  if (hr > 100 || hr < 50) strokeScore += 10;
  // Family history
  if (family.stroke) strokeScore += 18;
  // Smoking
  strokeScore += smoke * 10;
  // Symptoms
  strokeScore += sym("Vision Problems") * 16;
  strokeScore += sym("Headache") * 8;
  // Retinal findings
  if (retinalDiabetic || retinalHypertensive) strokeScore += 15;
  if (ecgAbnormal) strokeScore += 12;
  // Metabolic comorbidity
  const hasDiabetesRisk = diabetes > 45;
  if (hasDiabetesRisk) strokeScore += 8;
  if (bmi > 30) strokeScore += 6;
  const stroke = clamp(Math.round(strokeScore * 0.48));

  // ── 5. CKD Risk (KDIGO-adapted) ───────────────────────────────────
  let ckdScore = 4;
  // Age
  if (age > 60) ckdScore += (age - 50) * 0.35;
  else if (age > 50) ckdScore += (age - 50) * 0.25;
  // Blood pressure (sustained HTN damages kidneys)
  if (sys > 140) ckdScore += (sys - 130) * 0.5;
  else if (sys > 130) ckdScore += (sys - 130) * 0.3;
  if (dia > 90) ckdScore += (dia - 85) * 0.3;
  // Diabetes comorbidity
  if (diabetes > 45) ckdScore += 18;
  // Hypertension comorbidity
  if (hypertension > 45) ckdScore += 14;
  // Family history
  if (family.ckd) ckdScore += 22;
  // Symptoms
  ckdScore += sym("Fatigue") * 10;
  // Retinal findings
  if (retinalDiabetic) ckdScore += 12;
  const ckd = clamp(Math.round(ckdScore));

  return {
    Diabetes: diabetes,
    Hypertension: hypertension,
    CVD: cvd,
    Stroke: stroke,
    CKD: ckd,
    explanations: {
      Diabetes: [
        { name: "Age", value: age >= 65 ? 18 : age >= 55 ? 14 : age >= 45 ? 10 : age >= 35 ? 5 : 0 },
        { name: "BMI", value: bmi >= 35 ? 25 : bmi >= 30 ? 18 : bmi >= 27 ? 12 : bmi >= 25 ? 6 : 0 },
        { name: "Family History", value: family.diabetes ? 16 : 0 },
        { name: "Diet & Activity", value: dietPoor * 10 + activityLow * 10 },
      ].filter(f => f.value > 0),
      Hypertension: [
        { name: "Systolic BP", value: sys >= 180 ? 45 : sys >= 140 ? 32 : sys >= 130 ? 18 : sys >= 120 ? 6 : 0 },
        { name: "Diastolic BP", value: dia >= 120 ? 30 : dia >= 90 ? 20 : dia >= 80 ? 8 : 0 },
        { name: "Age", value: age >= 55 ? 12 : age >= 45 ? 6 : 0 },
        { name: "Family History", value: family.hypertension ? 16 : 0 },
      ].filter(f => f.value > 0),
      CVD: [
        { name: "Age", value: age >= 65 ? 22 : age >= 55 ? 16 : age >= 45 ? 10 : age >= 35 ? 5 : 0 },
        { name: "Blood Pressure", value: sys >= 160 ? 24 : sys >= 140 ? 18 : sys >= 130 ? 10 : sys >= 120 ? 4 : 0 },
        { name: "Smoking", value: smoke * 10 },
        { name: "Family History", value: family.heartDisease ? 16 : 0 },
      ].filter(f => f.value > 0),
      Stroke: [
        { name: "Age", value: age >= 65 ? 24 : age >= 55 ? 16 : age >= 45 ? 8 : 0 },
        { name: "Blood Pressure", value: sys >= 160 ? 28 : sys >= 140 ? 20 : sys >= 130 ? 10 : 0 },
        { name: "Smoking", value: smoke * 10 },
        { name: "Family History", value: family.stroke ? 18 : 0 },
      ].filter(f => f.value > 0),
      CKD: [
        { name: "Age", value: age > 60 ? (age - 50) * 0.35 : age > 50 ? (age - 50) * 0.25 : 0 },
        { name: "Blood Pressure", value: sys > 140 ? (sys - 130) * 0.5 : sys > 130 ? (sys - 130) * 0.3 : 0 },
        { name: "Diabetes Comorbidity", value: diabetes > 45 ? 18 : 0 },
        { name: "Family History", value: family.ckd ? 22 : 0 },
      ].filter(f => f.value > 0),
    }
  };
}
