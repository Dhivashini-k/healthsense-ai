"""
Unit tests for the production Predictor API module (predictor.py).
"""

import pytest
import numpy as np
from src.predictor import load_model, predict

@pytest.fixture(scope="module")
def setup_model():
    load_model()

def test_predict_schema(setup_model):
    patient = {
        "gender": "Male",
        "age": 67,
        "hypertension": 1,
        "heart_disease": 0,
        "ever_married": "Yes",
        "work_type": "Private",
        "Residence_type": "Urban",
        "avg_glucose_level": 182.4,
        "bmi": 31.2,
        "smoking_status": "formerly smoked"
    }
    
    response = predict(patient)
    
    # Verify exact schema keys
    required_keys = [
        "disease", "probability", "risk_category", "confidence",
        "model", "threshold", "explanation", "recommendations"
    ]
    for key in required_keys:
        assert key in response
        
    assert response["disease"] == "Stroke Risk"
    assert isinstance(response["probability"], float)
    assert 0.0 <= response["probability"] <= 100.0
    assert response["risk_category"] in ["Low", "Moderate", "High"]
    assert 0.0 <= response["confidence"] <= 1.0
    assert isinstance(response["explanation"], dict)
    assert isinstance(response["recommendations"], list)
    assert len(response["recommendations"]) > 0

def test_predict_missing_fields(setup_model):
    # Test partial patient input (missing BMI and smoking_status)
    partial_patient = {
        "gender": "Female",
        "age": 45,
        "hypertension": 0,
        "heart_disease": 0,
        "ever_married": "No",
        "work_type": "Private",
        "Residence_type": "Rural",
        "avg_glucose_level": 95.0
    }
    
    response = predict(partial_patient)
    assert response["disease"] == "Stroke Risk"
    assert 0.0 <= response["probability"] <= 100.0

def test_low_risk_patient(setup_model):
    young_healthy_patient = {
        "gender": "Female",
        "age": 22,
        "hypertension": 0,
        "heart_disease": 0,
        "ever_married": "No",
        "work_type": "Private",
        "Residence_type": "Urban",
        "avg_glucose_level": 80.0,
        "bmi": 21.0,
        "smoking_status": "never smoked"
    }
    
    response = predict(young_healthy_patient)
    assert response["probability"] < 25.0
    assert response["risk_category"] == "Low"
