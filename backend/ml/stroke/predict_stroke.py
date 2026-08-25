import os
import joblib
import pandas as pd
import numpy as np

def predict_stroke_risk(patient_data: dict) -> dict:
    """
    Predicts Stroke Risk probability using trained XGBoost Calibrated Model.
    """
    base_dir = os.path.dirname(__file__)
    model_path = os.path.join(base_dir, "stroke_model.joblib")
    meta_path = os.path.join(base_dir, "model_metadata.joblib")

    if not os.path.exists(model_path) or not os.path.exists(meta_path):
        raise FileNotFoundError("Stroke ML model or metadata files not found.")

    model = joblib.load(model_path)
    metadata = joblib.load(meta_path)

    age = float(patient_data.get("age", 50))
    bmi = float(patient_data.get("bmi", 25.0))
    glucose = float(patient_data.get("avg_glucose_level", 100.0))
    sys = float(patient_data.get("systolic", 120))
    gender = patient_data.get("gender", "Female")
    smoking = patient_data.get("smoking", "never smoked")
    has_htn = 1 if sys >= 140 or patient_data.get("hypertension", 0) else 0
    has_hd = 1 if patient_data.get("heart_disease", 0) else 0

    features = {
        'age': age,
        'avg_glucose_level': glucose,
        'bmi': bmi,
        'glucose_bmi_ratio': glucose / bmi if bmi > 0 else 4.0,
        'high_glucose_flag': 1 if glucose > 140 else 0,
        'metabolic_risk_score': (1 if glucose > 140 else 0) + (1 if bmi > 30 else 0) + (1 if age > 60 else 0),
        'gender_Female': 1 if gender.lower() == 'female' else 0,
        'gender_Male': 1 if gender.lower() == 'male' else 0,
        'ever_married_No': 0,
        'ever_married_Yes': 1,
        'work_type_Govt_job': 0,
        'work_type_Never_worked': 0,
        'work_type_Private': 1,
        'work_type_Self-employed': 0,
        'work_type_children': 0,
        'Residence_type_Rural': 0,
        'Residence_type_Urban': 1,
        'smoking_status_Unknown': 1 if smoking.lower() == 'unknown' else 0,
        'smoking_status_formerly smoked': 1 if 'former' in smoking.lower() else 0,
        'smoking_status_never smoked': 1 if 'never' in smoking.lower() or smoking.lower() == 'none' else 0,
        'smoking_status_smokes': 1 if 'smoke' in smoking.lower() or smoking.lower() == 'regular' else 0,
        'hypertension': has_htn,
        'heart_disease': has_hd
    }

    feature_names = metadata.get('feature_names', list(features.keys()))
    df = pd.DataFrame([features])[feature_names]

    if hasattr(model, "predict_proba"):
        prob = float(model.predict_proba(df)[0, 1])
    else:
        prob = float(model.predict(df)[0])

    scaled_pct = min(100, max(0, round(prob * 100, 1)))
    category = "High" if scaled_pct >= 71 else "Moderate" if scaled_pct >= 41 else "Low"

    return {
        "risk_probability": round(prob, 4),
        "risk_percent": scaled_pct,
        "risk_category": category,
        "features_evaluated": len(feature_names)
    }
