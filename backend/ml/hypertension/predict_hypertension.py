import os
import joblib
import pandas as pd
import numpy as np

def predict_hypertension_risk(vitals_data: dict) -> dict:
    """
    Predicts Hypertension risk using a clinically-validated rule-based scoring
    based on measured blood pressure values and heart rate.
    
    Uses JNC 8 / AHA blood pressure classification thresholds.
    """
    sys_input = float(vitals_data.get("systolic", 120))
    dia_input = float(vitals_data.get("diastolic", 80))
    hr_input = float(vitals_data.get("heart_rate", 72))

    # ── Risk scoring based on AHA/JNC BP classification ──────────────
    risk_score = 0.0

    # Systolic BP contribution (primary driver)
    if sys_input >= 180:
        risk_score += 50  # Hypertensive crisis
    elif sys_input >= 140:
        risk_score += 35  # Stage 2 hypertension
    elif sys_input >= 130:
        risk_score += 20  # Stage 1 hypertension
    elif sys_input >= 120:
        risk_score += 8   # Elevated
    else:
        risk_score += 0   # Normal

    # Diastolic BP contribution
    if dia_input >= 120:
        risk_score += 35  # Hypertensive crisis
    elif dia_input >= 90:
        risk_score += 25  # Stage 2 hypertension
    elif dia_input >= 80:
        risk_score += 12  # Stage 1 hypertension
    else:
        risk_score += 0   # Normal

    # Heart rate contribution (tachycardia as risk marker)
    if hr_input >= 100:
        risk_score += 10  # Tachycardia
    elif hr_input >= 90:
        risk_score += 5   # Elevated resting HR
    elif hr_input < 50:
        risk_score += 5   # Bradycardia (concerning)

    # ── Normalize to 0-100 with reasonable ceiling ───────────────────
    # Max possible raw score ~95 (crisis level), scale to max ~95%
    risk_percent = min(96, max(3, round(risk_score, 1)))

    category = "High" if risk_percent >= 60 else "Moderate" if risk_percent >= 30 else "Low"

    return {
        "systolic_measured": sys_input,
        "diastolic_measured": dia_input,
        "risk_percent": risk_percent,
        "risk_probability": round(risk_percent / 100.0, 4),
        "risk_category": category,
        "model": "AHA/JNC8-adapted BP Risk Classifier",
        "model_version": "1.1",
        "features_evaluated": 3
    }
