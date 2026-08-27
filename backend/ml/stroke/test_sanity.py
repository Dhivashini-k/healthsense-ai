import os
import sys

# Ensure we can import predict_stroke
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from predict_stroke import predict_stroke_risk
except Exception as e:
    print(f"Error importing predict_stroke_risk: {e}")
    sys.exit(1)

def test_sanity():
    print("Running Sanity Checks for Stroke Model...")
    
    # 1. Normal Patient (Low Risk)
    normal_patient = {
        "age": 30,
        "gender": "Male",
        "bmi": 22.0,
        "avg_glucose_level": 85.0,
        "systolic": 115,
        "smoking": "never smoked",
        "hypertension": 0,
        "heart_disease": 0
    }
    normal_res = predict_stroke_risk(normal_patient)
    print(f"\n[Test 1] Normal Young Patient: {normal_res}")
    
    # 2. High Risk Patient (Elderly, Smoker, High BP, High Glucose)
    high_risk_patient = {
        "age": 75,
        "gender": "Male",
        "bmi": 32.0,
        "avg_glucose_level": 200.0,
        "systolic": 160,
        "smoking": "smokes",
        "hypertension": 1,
        "heart_disease": 1
    }
    high_risk_res = predict_stroke_risk(high_risk_patient)
    print(f"\n[Test 2] Elderly High Risk Patient: {high_risk_res}")
    
    if normal_res["risk_percent"] >= 30:
        print("\n[WARNING] Normal patient has unexpectedly high risk!")
    if high_risk_res["risk_percent"] <= 30:
        print("\n[WARNING] High-risk patient has unexpectedly low risk!")

    print("\nSanity Check Complete.")

if __name__ == "__main__":
    test_sanity()
