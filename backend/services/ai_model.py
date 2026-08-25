import numpy as np

def calculate_bmi(height_cm: float, weight_kg: float) -> float:
    if height_cm <= 0:
        return 24.2
    h_m = height_cm / 100.0
    return round(weight_kg / (h_m * h_m), 1)

def parse_bp(bp_str: str):
    try:
        parts = bp_str.split("/")
        systolic = float(parts[0])
        diastolic = float(parts[1]) if len(parts) > 1 else 80.0
        return systolic, diastolic
    except Exception:
        return 120.0, 80.0

def predict_ncd_risks(
    age: int,
    gender: str,
    height: float,
    weight: float,
    bp_str: str,
    heart_rate: int,
    oxygen_level: float,
    smoking: str = "never",
    alcohol: str = "none",
    exercise: str = "moderate",
    sleep: int = 7,
    stress: int = 5,
    family_history: list = None,
    symptoms: list = None
) -> dict:
    if family_history is None:
        family_history = []
    if symptoms is None:
        symptoms = []

    bmi = calculate_bmi(height, weight)
    systolic, diastolic = parse_bp(bp_str)

    # 1. Diabetes Risk (0-100%)
    diabetes_risk = 15.0
    if age > 45: diabetes_risk += 15
    if age > 60: diabetes_risk += 10
    if bmi >= 25 and bmi < 30: diabetes_risk += 14
    if bmi >= 30: diabetes_risk += 26
    if "diabetes" in [f.lower() for f in family_history]: diabetes_risk += 20
    if exercise == "sedentary": diabetes_risk += 12
    if any(s in [sym.lower() for sym in symptoms] for s in ["frequent urination", "frequenturination"]):
        diabetes_risk += 16
    if systolic >= 135: diabetes_risk += 8
    diabetes_risk = float(np.clip(round(diabetes_risk), 10, 98))

    # 2. Hypertension Risk (0-100%)
    hypertension_risk = 18.0
    if systolic >= 140 or diastolic >= 90: hypertension_risk += 45
    elif systolic >= 130 or diastolic >= 85: hypertension_risk += 28
    elif systolic >= 120 or diastolic >= 80: hypertension_risk += 15
    if age > 50: hypertension_risk += 12
    if bmi >= 28: hypertension_risk += 10
    if stress >= 7: hypertension_risk += 12
    if "headache" in [s.lower() for s in symptoms]: hypertension_risk += 10
    hypertension_risk = float(np.clip(round(hypertension_risk), 12, 99))

    # 3. Cardiovascular Disease (CVD) Risk (0-100%)
    cvd_risk = 12.0
    if gender.lower() == "male" and age > 45: cvd_risk += 12
    if gender.lower() == "female" and age > 55: cvd_risk += 10
    if smoking in ["current", "heavy"]: cvd_risk += 25
    if smoking == "former": cvd_risk += 10
    if systolic >= 140 or diastolic >= 90: cvd_risk += 20
    if bmi >= 30: cvd_risk += 14
    if "heart" in [f.lower() for f in family_history] or "heart disease" in [f.lower() for f in family_history]:
        cvd_risk += 18
    if "chest pain" in [s.lower() for s in symptoms] or "chestpain" in [s.lower() for s in symptoms]:
        cvd_risk += 24
    if "breathlessness" in [s.lower() for s in symptoms]: cvd_risk += 12
    cvd_risk = float(np.clip(round(cvd_risk), 8, 96))

    # 4. Stroke Risk (0-100%)
    stroke_risk = 10.0
    if systolic >= 150: stroke_risk += 32
    elif systolic >= 140: stroke_risk += 20
    if smoking in ["current", "heavy"]: stroke_risk += 22
    if age > 60: stroke_risk += 18
    if "stroke" in [f.lower() for f in family_history]: stroke_risk += 20
    if alcohol == "heavy": stroke_risk += 12
    stroke_risk = float(np.clip(round(stroke_risk), 5, 95))

    # 5. Chronic Kidney Disease (CKD) Risk (0-100%)
    ckd_risk = 10.0
    if diabetes_risk > 50: ckd_risk += 22
    if systolic >= 140: ckd_risk += 20
    if age > 65: ckd_risk += 15
    if "ckd" in [f.lower() for f in family_history] or "kidney" in [f.lower() for f in family_history]:
        ckd_risk += 20
    if any(s in [sym.lower() for sym in symptoms] for s in ["swollen ankles", "edema"]):
        ckd_risk += 18
    ckd_risk = float(np.clip(round(ckd_risk), 5, 94))

    # Overall Composite Risk
    overall_risk = float(round(
        diabetes_risk * 0.25 +
        hypertension_risk * 0.20 +
        cvd_risk * 0.25 +
        stroke_risk * 0.15 +
        ckd_risk * 0.15
    ))

    # Classification: 0-40% Low Risk, 41-70% Moderate Risk, 71-100% High Risk
    risk_level = "Low Risk"
    if overall_risk >= 71:
        risk_level = "High Risk"
    elif overall_risk >= 41:
        risk_level = "Moderate Risk"

    # Determine Primary Disease & Specialist Assignment
    diseases = [
        {"name": "Diabetes", "score": diabetes_risk, "specialty": "Endocrinologist", "doctor": "Dr. Arjun Mehta (Endocrinologist)"},
        {"name": "Hypertension", "score": hypertension_risk, "specialty": "Cardiologist", "doctor": "Dr. Rajesh Gupta (Cardiologist)"},
        {"name": "CVD", "score": cvd_risk, "specialty": "Cardiologist", "doctor": "Dr. Rajesh Gupta (Cardiologist)"},
        {"name": "Stroke", "score": stroke_risk, "specialty": "Neurologist", "doctor": "Dr. Robert Chen (Neurologist)"},
        {"name": "CKD", "score": ckd_risk, "specialty": "Nephrologist", "doctor": "Dr. Alistair Vance (Nephrologist)"}
    ]
    diseases.sort(key=lambda x: x["score"], reverse=True)

    assigned_specialist = diseases[0]["specialty"] if diseases[0]["score"] >= 41 else "None (Low Risk)"
    assigned_doctor = diseases[0]["doctor"] if diseases[0]["score"] >= 41 else "Nurse Sarah (General Practice)"

    return {
        "diabetes_risk": diabetes_risk,
        "hypertension_risk": hypertension_risk,
        "cvd_risk": cvd_risk,
        "stroke_risk": stroke_risk,
        "ckd_risk": ckd_risk,
        "overall_risk": overall_risk,
        "risk_level": risk_level,
        "assigned_specialist": assigned_specialist,
        "assigned_doctor": assigned_doctor,
        "primary_disease": diseases[0]["name"],
        "bmi": bmi
    }
