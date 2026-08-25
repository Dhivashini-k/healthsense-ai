import sys
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

# Ensure ML model paths are importable
backend_dir = os.path.dirname(os.path.dirname(__file__))
ckd_dir = os.path.join(backend_dir, "ml", "ckd")
stroke_dir = os.path.join(backend_dir, "ml", "stroke")
htn_dir = os.path.join(backend_dir, "ml", "hypertension")

for d in [ckd_dir, stroke_dir, htn_dir]:
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

router = APIRouter(prefix="/api/v1/ml", tags=["NCD Machine Learning Models"])

class PatientScreeningPayload(BaseModel):
    age: Optional[float] = 52.0
    gender: Optional[str] = "Female"
    bmi: Optional[float] = 26.5
    systolic: Optional[float] = 138.0
    diastolic: Optional[float] = 88.0
    heartRate: Optional[float] = 78.0
    smoking: Optional[str] = "None"
    activity: Optional[str] = "Moderate"
    diet: Optional[str] = "Average"
    stress: Optional[str] = "Low"
    diabetes: Optional[int] = 0
    hypertension: Optional[int] = 0
    familyCKD: Optional[int] = 0
    familyStroke: Optional[int] = 0
    familyHeart: Optional[int] = 0
    ecgStatus: Optional[str] = "Normal Sinus Rhythm"
    retinalStatus: Optional[str] = "Normal Retina"

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
        except Exception:
            pass

    # 2. Stroke ML Prediction
    stroke_res = {}
    if STROKE_AVAILABLE:
        try:
            stroke_res = predict_stroke_risk({
                'age': p['age'], 'gender': p['gender'], 'bmi': p['bmi'],
                'systolic': p['systolic'], 'smoking': p['smoking'],
                'hypertension': p['hypertension'], 'heart_disease': p['familyHeart']
            })
        except Exception:
            pass

    # 3. Hypertension ML Prediction
    htn_res = {}
    if HTN_AVAILABLE:
        try:
            htn_res = predict_hypertension_risk({
                'systolic': p['systolic'], 'diastolic': p['diastolic'],
                'heart_rate': p['heartRate']
            })
        except Exception:
            pass

    return {
        "status": "success",
        "models_active": {
            "ckd_xgboost": CKD_AVAILABLE,
            "stroke_xgboost_calibrated": STROKE_AVAILABLE,
            "hypertension_catboost_xgb": HTN_AVAILABLE
        },
        "predictions": {
            "CKD": ckd_res,
            "Stroke": stroke_res,
            "Hypertension": htn_res
        }
    }
