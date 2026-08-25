import sys
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

# Ensure ml/ckd path is importable
ckd_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml", "ckd")
if ckd_dir not in sys.path:
    sys.path.append(ckd_dir)

try:
    from predict import predict_ckd_risk
    MODEL_LOADED = True
except Exception as e:
    MODEL_LOADED = False
    MODEL_ERROR = str(e)

router = APIRouter(prefix="/api/v1/ml", tags=["CKD Machine Learning Model"])

class CKDScreeningData(BaseModel):
    Age: Optional[float] = 50.0
    Sex: Optional[str] = "Female"
    BMI: Optional[float] = 25.0
    Systolic_BP: Optional[float] = 130.0
    Diastolic_BP: Optional[float] = 85.0
    Diabetes: Optional[int] = 0
    Hypertension: Optional[int] = 0
    Cardiovascular_Disease: Optional[int] = 0
    Smoking_Status: Optional[str] = "Never"
    Physical_Activity_Level: Optional[str] = "Moderate"
    Stress_Level: Optional[str] = "Low"
    Family_History_CKD: Optional[int] = 0
    Water_Intake_L: Optional[float] = 2.0
    Sleep_Duration_Hours: Optional[float] = 7.0

@router.post("/predict-ckd")
def predict_ckd(data: CKDScreeningData):
    if not MODEL_LOADED:
        raise HTTPException(status_code=500, detail=f"CKD ML Model not available: {MODEL_ERROR}")
    
    try:
        user_dict = data.dict()
        result = predict_ckd_risk(user_dict)
        return {
            "status": "success",
            "model": "XGBoost / Random Forest CKD Classifier",
            "prediction": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.get("/ckd-info")
def get_ckd_info():
    return {
        "status": "online" if MODEL_LOADED else "offline",
        "model_name": "Trained CKD Risk Progression Model 2026",
        "features": [
            "Age", "Sex", "BMI", "Systolic_BP", "Diastolic_BP",
            "Diabetes", "Hypertension", "Family_History_CKD"
        ]
    }
