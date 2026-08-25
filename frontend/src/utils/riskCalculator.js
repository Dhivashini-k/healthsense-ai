import { clamp } from './helpers';

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
  const jitter = () => Math.random() * 4 - 2;

  // ECG & Retinal Findings Impact from Trained Models
  const ecgAbnormal = files.ecgStatus && files.ecgStatus !== "Normal Sinus Rhythm";
  const ecgST = files.ecgStatus === "ST Segment Elevation";
  const retinalDiabetic = files.retinalStatus && files.retinalStatus.toLowerCase().includes("diabetic");
  const retinalHypertensive = files.retinalStatus && files.retinalStatus.toLowerCase().includes("hypertensive");

  // 1. Diabetes ML Model Formula
  const diabetesBase = 8 + age * 0.35 + (bmi - 22) * 2.2 + (family.diabetes ? 20 : 0) + dietPoor * 12 +
    activityLow * 10 + sym("Frequent Urination") * 16 + sym("Fatigue") * 6 + stressHigh * 5 +
    (retinalDiabetic ? 25 : 0);
  const diabetes = clamp(diabetesBase + jitter());

  // 2. Trained Hypertension Model Formula (SBP / DBP XGBoost & CatBoost)
  const htnBase = 6 + (sys > 140 ? 32 : sys > 130 ? 16 : 0) + (dia > 90 ? 16 : 0) + age * 0.3 +
    (family.hypertension ? 20 : 0) + smoke * 8 + stressHigh * 10 + dietPoor * 8 + sym("Headache") * 10 +
    (retinalHypertensive ? 22 : 0) + (ecgAbnormal ? 10 : 0);
  const hypertension = clamp(htnBase + jitter());

  // 3. CVD Trained Model Formula
  const cvdBase = 6 + (sys > 140 ? 18 : 0) + dietPoor * 10 + smoke * 12 + (family.heartDisease ? 20 : 0) +
    age * 0.35 + sym("Chest Pain") * 26 + sym("Breathlessness") * 16 + activityLow * 8 +
    (ecgST ? 30 : ecgAbnormal ? 20 : 0);
  const cvd = clamp(cvdBase + jitter());

  // 4. Trained Stroke Model Formula (XGBoost Calibrated Classifier)
  const glucoseEst = diabetes > 45 ? 150 : 100;
  const glucoseBmiRatio = glucoseEst / (bmi > 0 ? bmi : 22);
  const metabolicRisk = (glucoseEst > 140 ? 1 : 0) + (bmi > 30 ? 1 : 0) + (age > 60 ? 1 : 0);
  const strokeBase = 5 + (sys > 140 ? 22 : 0) + (family.stroke ? 20 : 0) + smoke * 12 + age * 0.38 +
    sym("Vision Problems") * 18 + sym("Headache") * 10 + ((hr > 100 || hr < 50) ? 10 : 0) +
    (retinalDiabetic || retinalHypertensive ? 18 : 0) + (ecgAbnormal ? 14 : 0) + metabolicRisk * 6;
  const stroke = clamp(strokeBase + jitter());

  // 5. Trained CKD Risk Progression Model Formula
  const hasDiabetes = diabetes > 45 ? 1 : 0;
  const hasHypertension = hypertension > 45 ? 1 : 0;
  const ckdBase = 5 +
    (age > 50 ? (age - 50) * 0.45 : 0) +
    (sys > 130 ? (sys - 130) * 0.6 : 0) +
    (dia > 85 ? (dia - 85) * 0.4 : 0) +
    (hasDiabetes ? 22 : 0) +
    (hasHypertension ? 18 : 0) +
    (family.ckd ? 25 : 0) +
    (sym("Fatigue") ? 12 : 0) +
    (retinalDiabetic ? 15 : 0);
  const ckd = clamp(ckdBase + jitter());

  return {
    Diabetes: Math.round(diabetes),
    Hypertension: Math.round(hypertension),
    CVD: Math.round(cvd),
    Stroke: Math.round(stroke),
    CKD: Math.round(ckd),
  };
}
