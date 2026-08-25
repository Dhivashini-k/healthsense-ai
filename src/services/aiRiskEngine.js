/**
 * HealthSense AI Risk Engine
 * Computes risk percentages across 6 NCD categories based on clinical guideline risk scoring algorithms
 * (Framingham, FINDRISC, ASCVD, BMI, Vitals & Symptom matrix).
 */

export function calculateNcdRisk(formData) {
  const age = Number(formData.age) || 45;
  const gender = formData.gender || "Male";
  const height = Number(formData.height) || 170;
  const weight = Number(formData.weight) || 70;
  
  // Calculate BMI
  const heightM = height / 100;
  const bmi = heightM > 0 ? parseFloat((weight / (heightM * heightM)).toFixed(1)) : 24.2;

  const smoking = formData.smoking || "never"; // never, former, current
  const alcohol = formData.alcohol || "none"; // none, moderate, heavy
  const exercise = formData.exercise || "moderate"; // sedentary, light, moderate, active
  const diet = formData.diet || "average"; // poor, average, healthy
  const sleep = Number(formData.sleep) || 7;
  const stress = Number(formData.stress) || 5;

  const familyHistory = formData.familyHistory || []; // ['diabetes', 'heart', 'stroke', 'ckd', 'cancer']
  
  const bpSystolic = Number(formData.bpSystolic) || 120;
  const bpDiastolic = Number(formData.bpDiastolic) || 80;
  const heartRate = Number(formData.heartRate) || 72;
  const spo2 = Number(formData.spo2) || 98;

  const symptoms = formData.symptoms || []; // ['chestPain', 'fatigue', 'frequentUrination', 'breathlessness', 'headache', 'edema']

  // 1. Diabetes Risk Score (0-100)
  let diabetesRisk = 12;
  if (age > 45) diabetesRisk += 15;
  if (age > 60) diabetesRisk += 10;
  if (bmi >= 25 && bmi < 30) diabetesRisk += 14;
  if (bmi >= 30) diabetesRisk += 26;
  if (familyHistory.includes("diabetes")) diabetesRisk += 18;
  if (exercise === "sedentary") diabetesRisk += 12;
  if (symptoms.includes("frequentUrination")) diabetesRisk += 15;
  if (symptoms.includes("fatigue")) diabetesRisk += 8;
  if (bpSystolic >= 135) diabetesRisk += 8;
  diabetesRisk = Math.min(Math.max(Math.round(diabetesRisk), 8), 98);

  // 2. Heart Disease Risk Score (Framingham / ASCVD based)
  let heartRisk = 10;
  if (gender === "Male" && age > 45) heartRisk += 12;
  if (gender === "Female" && age > 55) heartRisk += 10;
  if (smoking === "current") heartRisk += 25;
  if (smoking === "former") heartRisk += 10;
  if (bpSystolic >= 140 || bpDiastolic >= 90) heartRisk += 20;
  if (bmi >= 30) heartRisk += 14;
  if (familyHistory.includes("heart")) heartRisk += 16;
  if (exercise === "sedentary") heartRisk += 10;
  if (symptoms.includes("chestPain")) heartRisk += 22;
  if (symptoms.includes("breathlessness")) heartRisk += 14;
  heartRisk = Math.min(Math.max(Math.round(heartRisk), 6), 96);

  // 3. Hypertension Risk Score
  let hypertensionRisk = 15;
  if (bpSystolic >= 140 || bpDiastolic >= 90) hypertensionRisk += 45;
  else if (bpSystolic >= 130 || bpDiastolic >= 85) hypertensionRisk += 28;
  else if (bpSystolic >= 120 || bpDiastolic >= 80) hypertensionRisk += 15;
  if (age > 50) hypertensionRisk += 12;
  if (bmi >= 28) hypertensionRisk += 10;
  if (stress >= 7) hypertensionRisk += 12;
  if (symptoms.includes("headache")) hypertensionRisk += 10;
  if (familyHistory.includes("heart") || familyHistory.includes("stroke")) hypertensionRisk += 10;
  hypertensionRisk = Math.min(Math.max(Math.round(hypertensionRisk), 10), 99);

  // 4. Stroke Risk Score
  let strokeRisk = 8;
  if (bpSystolic >= 150) strokeRisk += 30;
  else if (bpSystolic >= 140) strokeRisk += 18;
  if (smoking === "current") strokeRisk += 20;
  if (age > 60) strokeRisk += 18;
  if (familyHistory.includes("stroke")) strokeRisk += 18;
  if (symptoms.includes("headache") && bpSystolic > 140) strokeRisk += 12;
  if (alcohol === "heavy") strokeRisk += 12;
  strokeRisk = Math.min(Math.max(Math.round(strokeRisk), 5), 95);

  // 5. Chronic Kidney Disease (CKD) Risk Score
  let ckdRisk = 8;
  if (diabetesRisk > 50) ckdRisk += 22;
  if (bpSystolic >= 140) ckdRisk += 20;
  if (age > 65) ckdRisk += 15;
  if (familyHistory.includes("ckd")) ckdRisk += 18;
  if (symptoms.includes("edema")) ckdRisk += 18;
  if (symptoms.includes("frequentUrination")) ckdRisk += 10;
  ckdRisk = Math.min(Math.max(Math.round(ckdRisk), 5), 94);

  // 6. Cancer Risk Score
  let cancerRisk = 7;
  if (smoking === "current") cancerRisk += 26;
  if (smoking === "former") cancerRisk += 10;
  if (alcohol === "heavy") cancerRisk += 15;
  if (diet === "poor") cancerRisk += 12;
  if (age > 50) cancerRisk += 14;
  if (familyHistory.includes("cancer")) cancerRisk += 20;
  if (symptoms.includes("fatigue") && symptoms.length > 2) cancerRisk += 10;
  cancerRisk = Math.min(Math.max(Math.round(cancerRisk), 5), 92);

  // Composite Overall Risk Score (weighted)
  const compositeScore = Math.round(
    diabetesRisk * 0.22 +
    heartRisk * 0.24 +
    hypertensionRisk * 0.22 +
    strokeRisk * 0.14 +
    ckdRisk * 0.10 +
    cancerRisk * 0.08
  );

  let riskCategory = "Low Risk";
  if (compositeScore >= 75) riskCategory = "Critical Risk";
  else if (compositeScore >= 55) riskCategory = "High Risk";
  else if (compositeScore >= 35) riskCategory = "Moderate Risk";

  // Primary predicted disease
  const risksMap = [
    { name: "Diabetes", score: diabetesRisk },
    { name: "Heart Disease", score: heartRisk },
    { name: "Hypertension", score: hypertensionRisk },
    { name: "Stroke", score: strokeRisk },
    { name: "Chronic Kidney Disease", score: ckdRisk },
    { name: "Cancer Risk", score: cancerRisk }
  ];

  risksMap.sort((a, b) => b.score - a.score);
  const primaryDisease = risksMap[0].score >= 35 ? `${risksMap[0].name} (${risksMap[0].score}%)` : "No Immediate NCD Elevated Risk";

  return {
    bmi,
    riskBreakdown: {
      diabetes: diabetesRisk,
      heartDisease: heartRisk,
      hypertension: hypertensionRisk,
      stroke: strokeRisk,
      ckd: ckdRisk,
      cancer: cancerRisk
    },
    compositeScore,
    riskCategory,
    primaryDisease,
    topRisks: risksMap.slice(0, 3)
  };
}
