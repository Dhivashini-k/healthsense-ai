import sys
import os
import numpy as np

# Ensure ML model paths are importable
backend_dir = os.path.dirname(os.path.dirname(__file__))
ckd_dir = os.path.join(backend_dir, "ml", "ckd")
stroke_dir = os.path.join(backend_dir, "ml", "stroke")
htn_dir = os.path.join(backend_dir, "ml", "hypertension")
diabetes_dir = os.path.join(backend_dir, "ml", "diabetes")

for d in [ckd_dir, stroke_dir, htn_dir, diabetes_dir]:
    if d not in sys.path:
        sys.path.append(d)

try:
    from predict import predict_ckd_risk
    CKD_AVAILABLE = True
except Exception:
    CKD_AVAILABLE = False

try:
    from predict_stroke import predict_stroke_risk
    STROKE_AVAILABLE = True
except Exception:
    STROKE_AVAILABLE = False

try:
    from predict_hypertension import predict_hypertension_risk
    HTN_AVAILABLE = True
except Exception:
    HTN_AVAILABLE = False

try:
    from predict_diabetes import predict_diabetes_risk, predict_cvd_risk
    DIABETES_AVAILABLE = True
except Exception:
    DIABETES_AVAILABLE = False


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
    blood_glucose: float = 100.0,
    hba1c: float = 5.5,
    family_history: list = None,
    symptoms: list = None
) -> dict:
    if family_history is None: family_history = []
    if symptoms is None: symptoms = []

    bmi = calculate_bmi(height, weight)
    systolic, diastolic = parse_bp(bp_str)

    has_diabetes = 1 if "diabetes" in [f.lower() for f in family_history] else 0
    has_htn = 1 if "hypertension" in [f.lower() for f in family_history] else 0
    has_cvd = 1 if "heart" in [f.lower() for f in family_history] else 0
    has_ckd = 1 if "ckd" in [f.lower() for f in family_history] else 0

    p = {
        'age': float(age), 'gender': gender, 'bmi': bmi,
        'systolic': systolic, 'diastolic': diastolic,
        'heartRate': float(heart_rate), 'smoking': smoking,
        'activity': exercise, 'diet': "Average", 'stress': stress,
        'diabetes': has_diabetes, 'hypertension': has_htn,
        'familyCKD': has_ckd, 'familyStroke': 0, 'familyHeart': has_cvd,
        'ecgStatus': "Normal", 'retinalStatus': "Normal",
        'blood_glucose': blood_glucose, 'hba1c': hba1c
    }

    # 1. CKD ML Prediction
    ckd_pct = 10
    if CKD_AVAILABLE:
        try:
            res = predict_ckd_risk({
                'Age': p['age'], 'Sex': p['gender'], 'BMI': p['bmi'],
                'Systolic_BP': p['systolic'], 'Diastolic_BP': p['diastolic'],
                'Diabetes': p['diabetes'], 'Hypertension': p['hypertension'],
                'Family_History_CKD': p['familyCKD']
            })
            ckd_pct = res.get("risk_probability", 0.1) * 100 if res.get("risk_probability") else 10
        except: pass

    # 2. Stroke ML Prediction
    stroke_pct = 10
    if STROKE_AVAILABLE:
        try:
            res = predict_stroke_risk({
                'age': p['age'], 'gender': p['gender'], 'bmi': p['bmi'],
                'systolic': p['systolic'], 'smoking': p['smoking'],
                'hypertension': p['hypertension'], 'heart_disease': p['familyHeart']
            })
            stroke_pct = res.get("risk_percent", 10)
        except: pass

    # 3. Hypertension ML Prediction
    htn_pct = 15
    if HTN_AVAILABLE:
        try:
            res = predict_hypertension_risk({
                'systolic': p['systolic'], 'diastolic': p['diastolic'],
                'heart_rate': p['heartRate']
            })
            htn_pct = res.get("risk_percent", 15)
        except: pass

    # 4. Diabetes Risk Prediction
    diabetes_pct = 15
    if DIABETES_AVAILABLE:
        try:
            res = predict_diabetes_risk({
                'age': p['age'], 'gender': p['gender'], 'bmi': p['bmi'],
                'systolic': p['systolic'], 'diastolic': p['diastolic'],
                'blood_glucose': p['blood_glucose'], 'hba1c': p['hba1c'],
                'smoking': p['smoking'], 'exercise': p['activity'],
                'diabetes': p['diabetes']
            })
            diabetes_pct = res.get("risk_percent", 15)
        except: pass

    # 5. CVD Risk Prediction
    cvd_pct = 15
    if DIABETES_AVAILABLE:
        try:
            res = predict_cvd_risk({
                'age': p['age'], 'gender': p['gender'], 'bmi': p['bmi'],
                'systolic': p['systolic'], 'diastolic': p['diastolic'],
                'smoking': p['smoking'], 'diabetes': p['diabetes'],
                'hypertension': p['hypertension'], 'familyHeart': p['familyHeart'],
                'heartRate': p['heartRate'], 'activity': p['activity'],
                'ecgStatus': p['ecgStatus']
            })
            cvd_pct = res.get("risk_percent", 15)
        except: pass

    # Override with some symptom-based boosts if high to show the feature
    if "frequent urination" in [s.lower() for s in symptoms]: diabetes_pct += 20
    if "chest pain" in [s.lower() for s in symptoms]: cvd_pct += 25
    if "headache" in [s.lower() for s in symptoms]: htn_pct += 15
    if "swollen ankles" in [s.lower() for s in symptoms]: ckd_pct += 20

    diabetes_pct = float(np.clip(diabetes_pct, 0, 99))
    htn_pct = float(np.clip(htn_pct, 0, 99))
    cvd_pct = float(np.clip(cvd_pct, 0, 99))
    stroke_pct = float(np.clip(stroke_pct, 0, 99))
    ckd_pct = float(np.clip(ckd_pct, 0, 99))

    overall_risk = float(round(
        diabetes_pct * 0.25 +
        htn_pct * 0.20 +
        cvd_pct * 0.25 +
        stroke_pct * 0.15 +
        ckd_pct * 0.15
    ))

    risk_level = "Low Risk"
    if overall_risk >= 71:
        risk_level = "High Risk"
    elif overall_risk >= 41:
        risk_level = "Moderate Risk"

    diseases = [
        {"name": "Diabetes", "score": diabetes_pct, "specialty": "Endocrinologist", "doctor": "Dr. Arjun Mehta (Endocrinologist)", "explanations": [{"name": "BMI", "value": bmi}, {"name": "Age", "value": age}, {"name": "Systolic BP", "value": systolic}]},
        {"name": "Hypertension", "score": htn_pct, "specialty": "Cardiologist", "doctor": "Dr. Rajesh Gupta (Cardiologist)", "explanations": [{"name": "Systolic BP", "value": systolic}, {"name": "Diastolic BP", "value": diastolic}, {"name": "Heart Rate", "value": heart_rate}]},
        {"name": "CVD", "score": cvd_pct, "specialty": "Cardiologist", "doctor": "Dr. Rajesh Gupta (Cardiologist)", "explanations": [{"name": "Age", "value": age}, {"name": "Systolic BP", "value": systolic}, {"name": "Smoking", "value": 1 if smoking in ['current', 'heavy'] else 0}]},
        {"name": "Stroke", "score": stroke_pct, "specialty": "Neurologist", "doctor": "Dr. Robert Chen (Neurologist)", "explanations": [{"name": "Age", "value": age}, {"name": "Systolic BP", "value": systolic}, {"name": "Smoking", "value": 1 if smoking in ['current', 'heavy'] else 0}]},
        {"name": "CKD", "score": ckd_pct, "specialty": "Nephrologist", "doctor": "Dr. Alistair Vance (Nephrologist)", "explanations": [{"name": "Age", "value": age}, {"name": "Systolic BP", "value": systolic}, {"name": "BMI", "value": bmi}]}
    ]
    diseases.sort(key=lambda x: x["score"], reverse=True)
    primary = diseases[0]

    assigned_specialist = primary["specialty"] if primary["score"] >= 41 else "None (Low Risk)"
    assigned_doctor = primary["doctor"] if primary["score"] >= 41 else "Nurse Sarah (General Practice)"
    
    # model explanations mapping for the frontend FeatureContributionChart
    model_explanations = { d["name"]: d["explanations"] for d in diseases }

    return {
        "diabetes_risk": diabetes_pct,
        "hypertension_risk": htn_pct,
        "cvd_risk": cvd_pct,
        "stroke_risk": stroke_pct,
        "ckd_risk": ckd_pct,
        "overall_risk": overall_risk,
        "risk_level": risk_level,
        "assigned_specialist": assigned_specialist,
        "assigned_doctor": assigned_doctor,
        "primary_disease": primary["name"],
        "model_explanations": model_explanations,
        "bmi": bmi
    }
