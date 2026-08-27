/**
 * HealthSense AI Risk Engine
 * Communicates with the FastAPI backend to compute risk percentages 
 * across NCD categories using ML models.
 */

export async function calculateNcdRisk(formData) {
  try {
    const age = Number(formData.age) || 45;
    const height = Number(formData.height) || 170;
    const weight = Number(formData.weight) || 70;
    
    // Calculate BMI
    const heightM = height / 100;
    const bmi = heightM > 0 ? parseFloat((weight / (heightM * heightM)).toFixed(1)) : 24.2;

    const payload = {
      age: age,
      gender: formData.gender || "Male",
      bmi: bmi,
      systolic: Number(formData.bpSystolic) || 120,
      diastolic: Number(formData.bpDiastolic) || 80,
      heartRate: Number(formData.heartRate) || 72,
      smoking: formData.smoking || "None",
      activity: formData.exercise || "Moderate",
      diet: formData.diet || "Average",
      stress: formData.stress || "Low",
      diabetes: formData.familyHistory?.includes("diabetes") ? 1 : 0,
      hypertension: formData.familyHistory?.includes("hypertension") ? 1 : 0,
      familyCKD: formData.familyHistory?.includes("ckd") || formData.familyHistory?.includes("kidney") ? 1 : 0,
      familyStroke: formData.familyHistory?.includes("stroke") ? 1 : 0,
      familyHeart: formData.familyHistory?.includes("heart") || formData.familyHistory?.includes("heart disease") ? 1 : 0,
      ecgStatus: formData.ecgStatus || "Normal Sinus Rhythm",
      retinalStatus: formData.retinalStatus || "Normal Retina",
      blood_glucose: Number(formData.bloodGlucose) || 100.0,
      hba1c: Number(formData.hba1c) || 5.5
    };

    const response = await fetch("http://localhost:8000/api/v1/ml/predict-all-ncd", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ML predictions: ${response.statusText}`);
    }

    const data = await response.json();

    // Map backend response format to frontend format
    // Handle both uppercase and lowercase keys from backend predictions
    const predictions = data.predictions || {};
    
    const diabetesRisk = predictions.diabetes?.risk_percent 
      || predictions.Diabetes?.risk_percent 
      || 10;
    
    const hypertensionRisk = predictions.Hypertension?.risk_percent 
      || predictions.hypertension?.risk_percent 
      || 10;
    
    const cvdRisk = predictions.cvd?.risk_percent 
      || predictions.CVD?.risk_percent 
      || 10;
    
    const strokeRisk = predictions.Stroke?.risk_percent 
      || predictions.stroke?.risk_percent 
      || 10;
    
    const ckdRisk = predictions.CKD?.risk_probability 
      ? Math.round(predictions.CKD.risk_probability * 100) 
      : (predictions.ckd?.risk_percent || 10);

    const compositeScore = data.overall_risk_score 
      || Math.round(diabetesRisk * 0.25 + hypertensionRisk * 0.20 + cvdRisk * 0.25 + strokeRisk * 0.15 + ckdRisk * 0.15);
    
    const riskCategory = data.risk_classification || (
      compositeScore >= 71 ? "High Risk" : compositeScore >= 41 ? "Moderate Risk" : "Low Risk"
    );

    const risksMap = [
      { name: "Diabetes", score: diabetesRisk },
      { name: "Heart Disease", score: cvdRisk },
      { name: "Hypertension", score: hypertensionRisk },
      { name: "Stroke", score: strokeRisk },
      { name: "Chronic Kidney Disease", score: ckdRisk }
    ];

    risksMap.sort((a, b) => b.score - a.score);
    const primaryDisease = risksMap[0].score >= 35 
      ? `${risksMap[0].name} (${risksMap[0].score}%)` 
      : "No Immediate NCD Elevated Risk";

    return {
      bmi,
      riskBreakdown: {
        diabetes: diabetesRisk,
        heartDisease: cvdRisk,
        hypertension: hypertensionRisk,
        stroke: strokeRisk,
        ckd: ckdRisk
      },
      compositeScore,
      riskCategory,
      primaryDisease,
      topRisks: risksMap.slice(0, 3),
      assignedSpecialist: data.assigned_specialist || null,
      assignedDoctor: data.assigned_doctor || null,
      modelsActive: data.models_active || {},
      model_explanations: data.model_explanations || {}
    };
  } catch (error) {
    console.error("AI Risk Engine Error:", error);
    // Return fallback low-risk structure so UI doesn't crash during demo
    return {
      bmi: 24.2,
      riskBreakdown: { diabetes: 10, heartDisease: 10, hypertension: 10, stroke: 10, ckd: 10 },
      compositeScore: 10,
      riskCategory: "Low Risk",
      primaryDisease: "System Error (Fallback)",
      topRisks: [],
      assignedSpecialist: null,
      assignedDoctor: null,
      modelsActive: {}
    };
  }
}
