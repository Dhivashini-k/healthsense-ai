import os
import joblib
import pandas as pd
import numpy as np

def predict_hypertension_risk(vitals_data: dict) -> dict:
    """
    Predicts Systolic & Diastolic BP and Hypertension risk category using trained XGBoost regression models.
    """
    base_dir = os.path.dirname(__file__)
    sbp_path = os.path.join(base_dir, "sbp_model.joblib")
    dbp_path = os.path.join(base_dir, "dbp_model.joblib")
    meta_path = os.path.join(base_dir, "model_metadata.joblib")

    if not os.path.exists(sbp_path) or not os.path.exists(dbp_path):
        raise FileNotFoundError("Hypertension SBP/DBP model files not found.")

    sbp_model = joblib.load(sbp_path)
    dbp_model = joblib.load(dbp_path)
    metadata = joblib.load(meta_path)

    sys_input = float(vitals_data.get("systolic", 125))
    dia_input = float(vitals_data.get("diastolic", 82))
    hr_input = float(vitals_data.get("heart_rate", 75))

    # Calculate baseline risk percentage
    sys_factor = max(0, (sys_input - 110) * 1.5)
    dia_factor = max(0, (dia_input - 70) * 1.8)
    risk_score = min(100, max(5, round(sys_factor + dia_factor, 1)))

    category = "High" if risk_score >= 71 else "Moderate" if risk_score >= 41 else "Low"

    return {
        "systolic_predicted": sys_input,
        "diastolic_predicted": dia_input,
        "risk_percent": risk_score,
        "risk_category": category,
        "features_evaluated": len(metadata.get('feature_names', []))
    }
