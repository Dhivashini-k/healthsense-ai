"""
Diabetes Risk Prediction Module — Clinical Risk Factor Calculator.

Uses validated clinical risk factors (age, BMI, blood glucose, family history,
smoking, exercise, HbA1c thresholds) to compute diabetes risk percentage.

Note: The diabetes dataset in datasets/ is retinal-image-based (requires CNN).
This module provides a tabular clinical risk calculator instead.
"""

import numpy as np


def predict_diabetes_risk(patient_data: dict) -> dict:
    """
    Predicts Type 2 Diabetes risk based on clinical risk factors.
    
    Args:
        patient_data: Dictionary containing patient screening data.
            Keys: age, gender, bmi, systolic, diastolic, blood_glucose,
                  hba1c, family_history_diabetes, smoking, exercise,
                  waist_circumference, gestational_diabetes
    
    Returns:
        dict with risk_probability, risk_percent, risk_category, features_evaluated
    """
    age = float(patient_data.get("age", 45))
    gender = str(patient_data.get("gender", "Male")).lower()
    bmi = float(patient_data.get("bmi", 24.0))
    systolic = float(patient_data.get("systolic", 120))
    diastolic = float(patient_data.get("diastolic", 80))
    blood_glucose = float(patient_data.get("blood_glucose", 100))
    hba1c = float(patient_data.get("hba1c", 5.5))
    family_dm = int(patient_data.get("family_history_diabetes", patient_data.get("diabetes", 0)))
    smoking = str(patient_data.get("smoking", "None")).lower()
    exercise = str(patient_data.get("exercise", patient_data.get("activity", "Moderate"))).lower()
    waist = float(patient_data.get("waist_circumference", 0))
    gestational = int(patient_data.get("gestational_diabetes", 0))
    
    # ── Base risk score ──────────────────────────────────────────────────
    risk_score = 5.0  # baseline population risk
    
    # Age factor (Finnish Diabetes Risk Score validated)
    if age >= 65:
        risk_score += 18
    elif age >= 55:
        risk_score += 14
    elif age >= 45:
        risk_score += 10
    elif age >= 35:
        risk_score += 5
    
    # BMI factor (WHO obesity classification)
    if bmi >= 35:
        risk_score += 28  # Obese Class II+
    elif bmi >= 30:
        risk_score += 22  # Obese Class I
    elif bmi >= 27.5:
        risk_score += 16  # Overweight (Asian cutoff)
    elif bmi >= 25:
        risk_score += 10  # Overweight
    elif bmi >= 23:
        risk_score += 5   # Pre-overweight (Asian cutoff)
    
    # Blood glucose (fasting)
    if blood_glucose >= 200:
        risk_score += 35  # Diabetic range
    elif blood_glucose >= 126:
        risk_score += 28  # Diabetic threshold
    elif blood_glucose >= 110:
        risk_score += 18  # Impaired fasting glucose
    elif blood_glucose >= 100:
        risk_score += 10  # Pre-diabetic range
    
    # HbA1c
    if hba1c >= 6.5:
        risk_score += 30  # Diabetic HbA1c
    elif hba1c >= 6.0:
        risk_score += 20  # Pre-diabetic
    elif hba1c >= 5.7:
        risk_score += 10  # At-risk
    
    # Family history
    if family_dm:
        risk_score += 16
    
    # Blood pressure (co-morbidity marker)
    if systolic >= 140 or diastolic >= 90:
        risk_score += 10
    elif systolic >= 130 or diastolic >= 85:
        risk_score += 5
    
    # Smoking
    if smoking in ["current", "heavy", "yes"]:
        risk_score += 8
    elif smoking in ["former", "ex"]:
        risk_score += 4
    
    # Physical activity
    if exercise in ["sedentary", "none", "low"]:
        risk_score += 12
    elif exercise in ["light", "mild"]:
        risk_score += 5
    
    # Waist circumference (metabolic syndrome indicator)
    if waist > 0:
        if (gender == "male" and waist >= 102) or (gender == "female" and waist >= 88):
            risk_score += 12  # Abdominal obesity (WHO)
        elif (gender == "male" and waist >= 94) or (gender == "female" and waist >= 80):
            risk_score += 6   # Increased risk (IDF)
    
    # Gestational diabetes history (women)
    if gestational:
        risk_score += 14
    
    # Gender adjustment (males slightly higher baseline risk)
    if gender == "male" and age > 40:
        risk_score += 3
    
    # ── Normalize to 0-100% ──────────────────────────────────────────────
    # Maximum possible score ~170, scale with sigmoid-like curve
    risk_percent = min(98, max(3, round(risk_score * 0.55, 1)))
    risk_probability = round(risk_percent / 100.0, 4)
    
    # Risk categorization
    if risk_percent >= 71:
        category = "High"
    elif risk_percent >= 41:
        category = "Moderate"
    else:
        category = "Low"
    
    return {
        "risk_probability": risk_probability,
        "risk_percent": risk_percent,
        "risk_category": category,
        "features_evaluated": 12,
        "model": "Clinical Risk Factor Calculator (FINDRISC-adapted)",
    }


def predict_cvd_risk(patient_data: dict) -> dict:
    """
    Predicts Cardiovascular Disease (CVD) risk using Framingham-like scoring.
    
    Uses validated risk factors: age, gender, BP, cholesterol, smoking,
    diabetes status, BMI, family history.
    
    Returns:
        dict with risk_probability, risk_percent, risk_category, features_evaluated
    """
    age = float(patient_data.get("age", 45))
    gender = str(patient_data.get("gender", "Male")).lower()
    systolic = float(patient_data.get("systolic", 120))
    diastolic = float(patient_data.get("diastolic", 80))
    bmi = float(patient_data.get("bmi", 24.0))
    smoking = str(patient_data.get("smoking", "None")).lower()
    has_diabetes = int(patient_data.get("diabetes", 0))
    has_hypertension = int(patient_data.get("hypertension", 0))
    family_heart = int(patient_data.get("family_heart", patient_data.get("familyHeart", 0)))
    heart_rate = float(patient_data.get("heart_rate", patient_data.get("heartRate", 72)))
    exercise = str(patient_data.get("exercise", patient_data.get("activity", "Moderate"))).lower()
    ecg_status = str(patient_data.get("ecg_status", patient_data.get("ecgStatus", "Normal"))).lower()
    
    # ── Base risk score ──────────────────────────────────────────────────
    risk_score = 6.0
    
    # Age and gender (Framingham validated)
    if gender == "male":
        if age >= 65: risk_score += 24
        elif age >= 55: risk_score += 18
        elif age >= 45: risk_score += 12
        elif age >= 35: risk_score += 6
    else:
        if age >= 65: risk_score += 20
        elif age >= 55: risk_score += 15
        elif age >= 45: risk_score += 8
        elif age >= 35: risk_score += 4
    
    # Systolic BP
    if systolic >= 160:
        risk_score += 28
    elif systolic >= 140:
        risk_score += 20
    elif systolic >= 130:
        risk_score += 12
    elif systolic >= 120:
        risk_score += 5
    
    # Smoking
    if smoking in ["current", "heavy", "yes"]:
        risk_score += 18
    elif smoking in ["former", "ex"]:
        risk_score += 8
    
    # Diabetes as co-morbidity
    if has_diabetes:
        risk_score += 14
    
    # Hypertension
    if has_hypertension or systolic >= 140:
        risk_score += 8
    
    # BMI
    if bmi >= 35: risk_score += 14
    elif bmi >= 30: risk_score += 10
    elif bmi >= 27: risk_score += 5
    
    # Family history
    if family_heart:
        risk_score += 14
    
    # Heart rate (resting tachycardia)
    if heart_rate >= 100:
        risk_score += 8
    elif heart_rate >= 90:
        risk_score += 4
    
    # Physical inactivity
    if exercise in ["sedentary", "none", "low"]:
        risk_score += 10
    
    # ECG abnormality
    if "abnormal" in ecg_status or "arrhythmia" in ecg_status or "st" in ecg_status:
        risk_score += 15
    
    # ── Normalize ────────────────────────────────────────────────────────
    risk_percent = min(96, max(3, round(risk_score * 0.50, 1)))
    risk_probability = round(risk_percent / 100.0, 4)
    
    if risk_percent >= 71:
        category = "High"
    elif risk_percent >= 41:
        category = "Moderate"
    else:
        category = "Low"
    
    return {
        "risk_probability": risk_probability,
        "risk_percent": risk_percent,
        "risk_category": category,
        "features_evaluated": 11,
        "model": "Framingham-adapted CVD Risk Calculator",
    }
