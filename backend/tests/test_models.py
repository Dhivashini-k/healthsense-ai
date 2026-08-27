import sys
import os

# Add backend dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from routers.ncd_ml_router import predict_all_ncd, PatientScreeningPayload
from pydantic import ValidationError
from services.ai_model import predict_ncd_risks

def test_predict_all_ncd_valid_input():
    print("Testing ML prediction endpoint with valid input...")
    payload = {
        "age": 60,
        "gender": "Male",
        "bmi": 28.0,
        "systolic": 150,
        "diastolic": 90,
        "heartRate": 75,
        "smoking": "former",
        "activity": "Low",
        "diet": "Average",
        "stress": "Medium",
        "diabetes": 1,
        "hypertension": 1,
        "familyCKD": 0,
        "familyStroke": 0,
        "familyHeart": 1,
        "ecgStatus": "Normal",
        "retinalStatus": "Normal",
        "blood_glucose": 130,
        "hba1c": 6.8
    }
    
    # Parse payload using Pydantic model
    model = PatientScreeningPayload(**payload)
    data = predict_all_ncd(model)
    
    assert data["status"] == "success"
    assert "models_active" in data
    assert "predictions" in data
    assert "overall_risk_score" in data
    assert "risk_classification" in data
    assert "primary_disease" in data
    assert "assigned_specialist" in data
    
    print("Valid input test passed.")

def test_predict_all_ncd_invalid_schema():
    print("Testing ML prediction endpoint with invalid schema...")
    payload = {
        "age": -5, # Invalid age
        "bmi": -10, # Invalid bmi
    }
    
    try:
        model = PatientScreeningPayload(**payload)
        predict_all_ncd(model)
        print("Invalid schema test failed. It should have thrown a ValidationError.")
    except ValidationError as e:
        print("Invalid schema test passed (caught ValidationError).")

def test_ai_model_sanity_low_risk():
    print("Testing ai_model low risk patient...")
    res = predict_ncd_risks(
        age=30, gender="Female", height=165, weight=60, bp_str="110/70", heart_rate=65, oxygen_level=99,
        smoking="never", alcohol="none", exercise="high", sleep=8, stress=2, blood_glucose=90, hba1c=5.0
    )
    assert res["overall_risk"] < 35, f"Expected Low Risk but got {res['overall_risk']}"
    assert res["risk_level"] == "Low Risk", f"Expected Low Risk but got {res['risk_level']}"
    print("Low risk sanity test passed.")

def test_ai_model_sanity_high_risk():
    print("Testing ai_model high risk patient...")
    res = predict_ncd_risks(
        age=65, gender="Male", height=170, weight=95, bp_str="165/95", heart_rate=90, oxygen_level=94,
        smoking="current", alcohol="moderate", exercise="sedentary", sleep=5, stress=8, blood_glucose=145, hba1c=7.5,
        family_history=["diabetes", "hypertension", "heart"], symptoms=["chest pain", "shortness of breath"]
    )
    assert res["overall_risk"] >= 41, f"Expected at least Moderate Risk but got {res['overall_risk']}"
    print("High risk sanity test passed.")

if __name__ == "__main__":
    print("Running synthetic tests...")
    test_predict_all_ncd_valid_input()
    test_predict_all_ncd_invalid_schema()
    test_ai_model_sanity_low_risk()
    test_ai_model_sanity_high_risk()
    print("All initial tests completed.")
