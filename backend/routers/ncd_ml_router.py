import sys
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
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
except Exception as e:
    CKD_AVAILABLE = False

try:
    from predict_stroke import predict_stroke_risk
    STROKE_AVAILABLE = True
except Exception as e:
    STROKE_AVAILABLE = False

try:
    from predict_hypertension import predict_hypertension_risk
    HTN_AVAILABLE = True
except Exception as e:
    HTN_AVAILABLE = False

try:
    from predict_diabetes import predict_diabetes_risk, predict_cvd_risk
    DIABETES_AVAILABLE = True
except Exception as e:
    DIABETES_AVAILABLE = False

router = APIRouter(prefix="/api/v1/ml", tags=["NCD Machine Learning Models"])

from pydantic import BaseModel, Field

class PatientScreeningPayload(BaseModel):
    age: Optional[float] = Field(52.0, ge=18, le=120)
    gender: Optional[str] = "Female"
    bmi: Optional[float] = Field(26.5, gt=0, le=100)
    systolic: Optional[float] = Field(138.0, ge=50, le=250)
    diastolic: Optional[float] = Field(88.0, ge=30, le=150)
    heartRate: Optional[float] = Field(78.0, ge=30, le=200)
    smoking: Optional[str] = "None"
    activity: Optional[str] = "Moderate"
    diet: Optional[str] = "Average"
    stress: Optional[str] = "Low"
    diabetes: Optional[int] = Field(0, ge=0, le=1)
    hypertension: Optional[int] = Field(0, ge=0, le=1)
    familyCKD: Optional[int] = Field(0, ge=0, le=1)
    familyStroke: Optional[int] = Field(0, ge=0, le=1)
    familyHeart: Optional[int] = Field(0, ge=0, le=1)
    ecgStatus: Optional[str] = "Normal Sinus Rhythm"
    retinalStatus: Optional[str] = "Normal Retina"
    blood_glucose: Optional[float] = Field(100.0, ge=0, le=1000)
    hba1c: Optional[float] = Field(5.5, ge=0, le=20)

@router.post("/predict-all-ncd")
def predict_all_ncd(data: PatientScreeningPayload):
    p = data.dict()
    
    # 1. CKD ML Prediction
    ckd_res = {}
    if CKD_AVAILABLE:
        try:
            ckd_res = predict_ckd_risk({
                'Age': p['age'], 'Sex': p['gender'], 'BMI': p['bmi'],
                'Systolic_BP': p['systolic'], 'Diastolic_BP': p['diastolic'],
                'Diabetes': p['diabetes'], 'Hypertension': p['hypertension'],
                'Family_History_CKD': p['familyCKD']
            })
        except Exception as e:
            print(f"[NCD] CKD prediction error: {e}")

    # 2. Stroke ML Prediction
    stroke_res = {}
    if STROKE_AVAILABLE:
        try:
            stroke_res = predict_stroke_risk({
                'age': p['age'], 'gender': p['gender'], 'bmi': p['bmi'],
                'systolic': p['systolic'], 'smoking': p['smoking'],
                'hypertension': p['hypertension'], 'heart_disease': p['familyHeart']
            })
        except Exception as e:
            print(f"[NCD] Stroke prediction error: {e}")

    # 3. Hypertension ML Prediction
    htn_res = {}
    if HTN_AVAILABLE:
        try:
            htn_res = predict_hypertension_risk({
                'systolic': p['systolic'], 'diastolic': p['diastolic'],
                'heart_rate': p['heartRate']
            })
        except Exception as e:
            print(f"[NCD] Hypertension prediction error: {e}")

    # 4. Diabetes Risk Prediction
    diabetes_res = {}
    if DIABETES_AVAILABLE:
        try:
            diabetes_res = predict_diabetes_risk({
                'age': p['age'], 'gender': p['gender'], 'bmi': p['bmi'],
                'systolic': p['systolic'], 'diastolic': p['diastolic'],
                'blood_glucose': p['blood_glucose'], 'hba1c': p['hba1c'],
                'smoking': p['smoking'], 'exercise': p['activity'],
                'diabetes': p['diabetes']
            })
        except Exception as e:
            print(f"[NCD] Diabetes prediction error: {e}")

    # 5. CVD Risk Prediction
    cvd_res = {}
    if DIABETES_AVAILABLE:
        try:
            cvd_res = predict_cvd_risk({
                'age': p['age'], 'gender': p['gender'], 'bmi': p['bmi'],
                'systolic': p['systolic'], 'diastolic': p['diastolic'],
                'smoking': p['smoking'], 'diabetes': p['diabetes'],
                'hypertension': p['hypertension'], 'familyHeart': p['familyHeart'],
                'heartRate': p['heartRate'], 'activity': p['activity'],
                'ecgStatus': p['ecgStatus']
            })
        except Exception as e:
            print(f"[NCD] CVD prediction error: {e}")

    # ── Compute overall risk score ───────────────────────────────────────
    # Extract risk percentages from each model
    diabetes_pct = diabetes_res.get("risk_percent", 15)
    htn_pct = htn_res.get("risk_percent", 15)
    cvd_pct = cvd_res.get("risk_percent", 15)
    stroke_pct = stroke_res.get("risk_percent", 10)
    ckd_pct = ckd_res.get("risk_probability", 0.1) * 100 if ckd_res.get("risk_probability") else 10

    # Weighted composite (same weights as ai_model.py)
    overall_risk = round(
        diabetes_pct * 0.25 +
        htn_pct * 0.20 +
        cvd_pct * 0.25 +
        stroke_pct * 0.15 +
        ckd_pct * 0.15,
        1
    )

    if overall_risk >= 71:
        risk_class = "High Risk"
    elif overall_risk >= 41:
        risk_class = "Moderate Risk"
    else:
        risk_class = "Low Risk"

    # ── Determine specialist assignment ──────────────────────────────────
    diseases = [
        {"name": "Diabetes", "score": diabetes_pct, "specialty": "Endocrinologist", "doctor": "Dr. Arjun Mehta (Endocrinologist)"},
        {"name": "Hypertension", "score": htn_pct, "specialty": "Cardiologist", "doctor": "Dr. Rajesh Gupta (Cardiologist)"},
        {"name": "CVD", "score": cvd_pct, "specialty": "Cardiologist", "doctor": "Dr. Rajesh Gupta (Cardiologist)"},
        {"name": "Stroke", "score": stroke_pct, "specialty": "Neurologist", "doctor": "Dr. Robert Chen (Neurologist)"},
        {"name": "CKD", "score": ckd_pct, "specialty": "Nephrologist", "doctor": "Dr. Alistair Vance (Nephrologist)"}
    ]
    diseases.sort(key=lambda x: x["score"], reverse=True)
    primary = diseases[0]

    # Generate mock explanations for the UI based on patient data (similar to ai_model.py)
    model_explanations = {
        "Diabetes": [{"name": "BMI", "value": p['bmi']}, {"name": "Age", "value": p['age']}, {"name": "Systolic BP", "value": p['systolic']}],
        "Hypertension": [{"name": "Systolic BP", "value": p['systolic']}, {"name": "Diastolic BP", "value": p['diastolic']}, {"name": "Heart Rate", "value": p['heartRate']}],
        "CVD": [{"name": "Age", "value": p['age']}, {"name": "Systolic BP", "value": p['systolic']}, {"name": "Smoking", "value": 1 if p['smoking'] in ['current', 'heavy'] else 0}],
        "Stroke": [{"name": "Age", "value": p['age']}, {"name": "Systolic BP", "value": p['systolic']}, {"name": "Smoking", "value": 1 if p['smoking'] in ['current', 'heavy'] else 0}],
        "CKD": [{"name": "Age", "value": p['age']}, {"name": "Systolic BP", "value": p['systolic']}, {"name": "BMI", "value": p['bmi']}]
    }

    return {
        "status": "success",
        "models_active": {
            "ckd_xgboost": CKD_AVAILABLE,
            "stroke_xgboost_calibrated": STROKE_AVAILABLE,
            "hypertension_catboost_xgb": HTN_AVAILABLE,
            "diabetes_clinical": DIABETES_AVAILABLE,
            "cvd_framingham": DIABETES_AVAILABLE
        },
        "predictions": {
            "CKD": ckd_res,
            "Stroke": stroke_res,
            "Hypertension": htn_res,
            "diabetes": diabetes_res,
            "cvd": cvd_res
        },
        "overall_risk_score": overall_risk,
        "risk_classification": risk_class,
        "primary_disease": primary["name"],
        "assigned_specialist": primary["specialty"] if primary["score"] >= 41 else "None (Low Risk)",
        "assigned_doctor": primary["doctor"] if primary["score"] >= 41 else "Nurse Sarah (General Practice)",
        "model_explanations": model_explanations
    }
