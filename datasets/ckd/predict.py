import joblib
import os
import pandas as pd

def predict_ckd_risk(user_data: dict) -> dict:
    """
    Predicts CKD risk based on user-provided non-invasive features.
    
    Args:
        user_data (dict): A dictionary containing the user's answers to the screening questionnaire.
            Keys should match the feature names used during training.
            
    Returns:
        dict: A dictionary containing:
            - predicted_class (int): 1 for High Risk, 0 for Low Risk
            - risk_probability (float): The probability of having CKD
            - risk_category (str): 'High', 'Moderate', or 'Low'
            - threshold (float): The threshold used for the decision
    """
    model_path = os.path.join(os.path.dirname(__file__), "ckd_risk_model.joblib")
    meta_path = os.path.join(os.path.dirname(__file__), "ckd_model_metadata.joblib")
    
    if not os.path.exists(model_path) or not os.path.exists(meta_path):
        raise FileNotFoundError("Model or metadata not found. Please train the model first.")
        
    pipeline = joblib.load(model_path)
    metadata = joblib.load(meta_path)
    
    # Convert input to DataFrame
    df = pd.DataFrame([user_data])
    
    # Ensure all expected columns are present (fill missing with NaN/None)
    all_features = metadata['numerical_features'] + metadata['categorical_features']
    for col in all_features:
        if col not in df.columns:
            df[col] = None
            
    # Reorder columns to match training
    df = df[all_features]
    
    # Predict Probability
    prob = pipeline.predict_proba(df)[0, 1]
    
    # Apply optimal threshold
    threshold = metadata['best_threshold']
    pred_class = 1 if prob >= threshold else 0
    
    # Categorize Risk
    if prob >= threshold + 0.2:
        category = "High"
    elif prob >= threshold:
        category = "Moderate"
    else:
        category = "Low"
        
    return {
        "predicted_class": pred_class,
        "risk_probability": round(prob, 4),
        "risk_category": category,
        "threshold": threshold
    }

if __name__ == "__main__":
    # Example usage
    sample_patient = {
        'Age': 55, 'Sex': 'Female', 'Ethnicity': 'Hispanic', 'Country': 'USA', 
        'Residence_Type': 'Urban', 'Education_Level': 'Bachelor', 'Socioeconomic_Status': 'Middle', 
        'Height_cm': 165.0, 'Weight_kg': 70.0, 'BMI': 25.7, 'Waist_Circumference_cm': 85.0, 
        'Smoking_Status': 'Never', 'Alcohol_Consumption': 'Occasional', 
        'Physical_Activity_Level': 'Moderate', 'Exercise_Hours_Per_Week': 3.0, 
        'Water_Intake_L': 2.0, 'Fast_Food_Frequency_Per_Week': 1, 'Sleep_Duration_Hours': 7.0, 
        'Stress_Level': 'Low', 'Diabetes': 1, 'Hypertension': 1, 'Cardiovascular_Disease': 0, 
        'Heart_Failure': 0, 'Hyperlipidemia': 1, 'Kidney_Stones': 0, 'Recurrent_UTI': 0, 
        'Autoimmune_Disease': 0, 'Family_History_CKD': 1, 'Obesity': 0, 'Systolic_BP': 140, 
        'Diastolic_BP': 90, 'Blood_Pressure_Category': 'Stage 2 Hypertension', 'ACE_Inhibitor': 1, 
        'ARB': 0, 'Diabetes_Medication': 1, 'Statin': 1, 'Diuretic': 0, 'NSAID_Usage': 0, 
        'Medication_Adherence': 1, 'Number_of_Medications': 3, 'Hospital_Visits': 1, 
        'Emergency_Visits': 0, 'Specialist_Visits': 2, 'Annual_Checkups': 1, 
        'Health_Insurance': 1, 'Annual_Household_Income_USD': 60000, 'Employment_Status': 'Employed'
    }
    
    result = predict_ckd_risk(sample_patient)
    print("Prediction Results:")
    print(result)
