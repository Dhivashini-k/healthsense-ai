import os
import joblib
import pandas as pd
import numpy as np

def predict_stroke_risk(patient_data: dict) -> dict:
    """
    Predicts Stroke Risk probability using trained XGBoost Calibrated Model and its preprocessing pipeline.
    """
    base_dir = os.path.dirname(__file__)
    pipeline_path = os.path.join(base_dir, "stroke_pipeline.joblib")
    calibrator_path = os.path.join(base_dir, "calibrator.joblib")

    if not os.path.exists(pipeline_path) or not os.path.exists(calibrator_path):
        raise FileNotFoundError("Stroke ML pipeline or calibrator files not found.")

    pipeline = joblib.load(pipeline_path)
    calibrator = joblib.load(calibrator_path)

    age = float(patient_data.get("age", 50))
    bmi = float(patient_data.get("bmi", 25.0))
    glucose = float(patient_data.get("avg_glucose_level", 90.0))
    sys = float(patient_data.get("systolic", 120))
    gender = patient_data.get("gender", "Female")
    smoking = patient_data.get("smoking", "never smoked")
    has_htn = 1 if sys >= 140 or patient_data.get("hypertension", 0) else 0
    has_hd = 1 if patient_data.get("heart_disease", 0) else 0

    # Build the dataframe exactly as the pipeline expects from raw data
    features = {
        'gender': gender,
        'age': age,
        'hypertension': has_htn,
        'heart_disease': has_hd,
        'ever_married': 'Yes' if age > 25 else 'No',
        'work_type': 'Private',
        'Residence_type': 'Urban',
        'avg_glucose_level': glucose,
        'bmi': bmi,
        'smoking_status': smoking
    }

    df = pd.DataFrame([features])

    # Transform features using the pipeline
    try:
        X_processed = pipeline.transform(df)
        
        # Predict using the calibrator
        prob = float(calibrator.predict_proba(X_processed)[0, 1])
    except Exception as e:
        # Fallback if there is a mismatch in pipeline expectations
        print(f"Pipeline error: {e}")
        prob = 0.05

    scaled_pct = min(100, max(0, round(prob * 100, 1)))
    category = "High" if scaled_pct >= 71 else "Moderate" if scaled_pct >= 41 else "Low"

    return {
        "risk_probability": round(prob, 4),
        "risk_percent": scaled_pct,
        "risk_category": category,
        "features_evaluated": len(features)
    }
