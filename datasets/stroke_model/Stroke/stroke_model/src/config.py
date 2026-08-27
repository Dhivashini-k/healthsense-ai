"""
Configuration module for Stroke Risk Prediction AI Module.
Contains file paths, feature categories, hyperparameters, and clinical threshold rules.
"""

from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_PATH = DATA_DIR / "healthcare-dataset-stroke-data.csv"
MODEL_DIR = BASE_DIR / "models"
OUTPUT_DIR = BASE_DIR / "outputs"
FIGURES_DIR = OUTPUT_DIR / "figures"
REPORTS_DIR = OUTPUT_DIR / "reports"

# Ensure directories exist
for path in [DATA_DIR, MODEL_DIR, OUTPUT_DIR, FIGURES_DIR, REPORTS_DIR]:
    path.mkdir(parents=True, exist_ok=True)

# Artifact Paths
PREPROCESSOR_PATH = MODEL_DIR / "stroke_pipeline.joblib"
MODEL_PATH = MODEL_DIR / "stroke_model.joblib"
CALIBRATOR_PATH = MODEL_DIR / "calibrator.joblib"
METADATA_PATH = MODEL_DIR / "model_metadata.joblib"
THRESHOLD_CONFIG_PATH = MODEL_DIR / "threshold_config.json"

# Data Constants
ID_COLUMN = "id"
TARGET_COLUMN = "stroke"
RANDOM_STATE = 42
TEST_SIZE = 0.20

# Feature Categorization
NUMERICAL_FEATURES = ["age", "avg_glucose_level", "bmi"]
CATEGORICAL_FEATURES = ["gender", "ever_married", "work_type", "Residence_type", "smoking_status"]
BINARY_FEATURES = ["hypertension", "heart_disease"]

# All input features expected in raw patient dict
ALL_INPUT_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES + BINARY_FEATURES

# Engineered Features
ENGINEERED_FEATURES = ["glucose_bmi_ratio", "high_glucose_flag", "metabolic_risk_score"]

# Feature Name Display Mapping for SHAP & Reports
FEATURE_NAME_MAP = {
    "age": "Age",
    "avg_glucose_level": "Average Glucose Level",
    "bmi": "Body Mass Index (BMI)",
    "hypertension": "Hypertension History",
    "heart_disease": "Heart Disease History",
    "smoking_status": "Smoking Status",
    "glucose_bmi_ratio": "Glucose to BMI Ratio",
    "metabolic_risk_score": "Metabolic Risk Index",
    "high_glucose_flag": "Hyperglycemia Flag",
    "work_type": "Work Type",
    "Residence_type": "Residence Type",
    "gender": "Gender",
    "ever_married": "Marital Status"
}

# Clinical Risk Stratification Thresholds (in percentage 0-100%)
RISK_CATEGORIES = {
    "LOW": (0.0, 30.0),
    "MODERATE": (30.0, 60.0),
    "HIGH": (60.0, 100.0)
}

# Clinical Recommendations mapping
RECOMMENDATION_RULES = {
    "HIGH_RISK": "Recommend immediate neurological evaluation and comprehensive stroke risk panel.",
    "MODERATE_RISK": "Recommend routine follow-up, cardiovascular assessment, and lifestyle modifications.",
    "LOW_RISK": "Maintain standard preventive care and periodic screening.",
    "HYPERTENSION": "Monitor blood pressure regularly and consult primary care for BP management.",
    "HIGH_GLUCOSE": "Perform HbA1c screening and glycemic evaluation for diabetes management.",
    "HEART_DISEASE": "Cardiology referral recommended for cardiac management.",
    "HIGH_BMI": "Encourage dietary consultation and structured weight management program.",
    "SMOKING": "Offer smoking cessation counseling and clinical support resources."
}
