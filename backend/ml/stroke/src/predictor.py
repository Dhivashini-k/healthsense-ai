"""
Production Prediction API module for Health Sense AI Backend.
Exposes ONLY load_model() and predict(patient).
No FastAPI, no frontend, no database.
"""

import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional, Union

try:
    from src.config import (
        PREPROCESSOR_PATH, MODEL_PATH, CALIBRATOR_PATH,
        METADATA_PATH, THRESHOLD_CONFIG_PATH, ALL_INPUT_FEATURES,
        RISK_CATEGORIES, RECOMMENDATION_RULES
    )
    from src.utils import logger, load_json
    from src.explainability import StrokeExplainer
except ImportError:
    from .config import (
        PREPROCESSOR_PATH, MODEL_PATH, CALIBRATOR_PATH,
        METADATA_PATH, THRESHOLD_CONFIG_PATH, ALL_INPUT_FEATURES,
        RISK_CATEGORIES, RECOMMENDATION_RULES
    )
    from .utils import logger, load_json
    from .explainability import StrokeExplainer

# Module-level singletons for low-latency inference
_PREPROCESSOR = None
_MODEL = None
_CALIBRATOR = None
_METADATA = None
_THRESHOLD_CONFIG = None
_EXPLAINER = None
_IS_LOADED = False

def load_model(model_dir: Optional[Union[str, Path]] = None) -> bool:
    """
    Loads all trained model artifacts into memory singletons.
    
    Args:
        model_dir: Optional custom path to models directory.
        
    Returns:
        True if all artifacts loaded successfully.
    """
    global _PREPROCESSOR, _MODEL, _CALIBRATOR, _METADATA, _THRESHOLD_CONFIG, _EXPLAINER, _IS_LOADED
    
    dir_path = Path(model_dir) if model_dir else MODEL_PATH.parent
    logger.info(f"Loading Stroke Model artifacts from {dir_path}...")
    
    prep_path = dir_path / "stroke_pipeline.joblib" if model_dir else PREPROCESSOR_PATH
    model_path = dir_path / "stroke_model.joblib" if model_dir else MODEL_PATH
    calib_path = dir_path / "calibrator.joblib" if model_dir else CALIBRATOR_PATH
    meta_path = dir_path / "model_metadata.joblib" if model_dir else METADATA_PATH
    thresh_path = dir_path / "threshold_config.json" if model_dir else THRESHOLD_CONFIG_PATH

    if not (prep_path.exists() and model_path.exists() and calib_path.exists() and meta_path.exists() and thresh_path.exists()):
        raise FileNotFoundError(f"Required model artifacts not found in {dir_path}. Train model first.")

    _PREPROCESSOR = joblib.load(prep_path)
    _MODEL = joblib.load(model_path)
    _CALIBRATOR = joblib.load(calib_path)
    _METADATA = joblib.load(meta_path)
    _THRESHOLD_CONFIG = load_json(thresh_path)
    
    # Initialize SHAP Explainer
    feature_names = _METADATA.get("feature_names", [])
    _EXPLAINER = StrokeExplainer(_MODEL, feature_names)
    
    _IS_LOADED = True
    logger.info("Stroke Model artifacts loaded successfully!")
    return True

def predict(patient: Dict[str, Any]) -> Dict[str, Any]:
    """
    Predicts stroke risk for a given patient dictionary.
    
    Args:
        patient: Dictionary containing patient clinical variables.
        
    Returns:
        Dictionary adhering to Health Sense AI schema specification.
    """
    global _IS_LOADED, _PREPROCESSOR, _MODEL, _CALIBRATOR, _THRESHOLD_CONFIG, _EXPLAINER
    
    if not _IS_LOADED:
        load_model()

    # Validate input features
    missing = [feat for feat in ALL_INPUT_FEATURES if feat not in patient]
    if missing:
        raise ValueError(f"Missing required clinical input features: {missing}")

    # 1. Convert to DataFrame
    df_raw = pd.DataFrame([patient])
    
    # 2. Transform Features via Preprocessing Pipeline
    X_trans = _PREPROCESSOR.transform(df_raw)

    # 3. Calibrated Risk Probability
    raw_proba = _MODEL.predict_proba(X_trans)[:, 1]
    calibrated_proba = _CALIBRATOR.predict_proba(X_trans)[:, 1][0]
    
    risk_pct = round(float(calibrated_proba) * 100.0, 1)

    # 4. Clinical Threshold Decision
    threshold = float(_THRESHOLD_CONFIG.get("optimal_threshold", 0.5))
    
    if risk_pct >= (threshold * 100.0):
        risk_cat = "High"
    elif risk_pct >= (threshold * 50.0):
        risk_cat = "Moderate"
    else:
        risk_cat = "Low"

    # Confidence calculation
    confidence_val = max(calibrated_proba, 1.0 - calibrated_proba)
    confidence_pct = round(float(confidence_val) * 100.0, 1)

    # 5. SHAP Feature Attribution Explanation
    explanation = _EXPLAINER.explain_instance(X_trans, top_k=4)

    # 6. Actionable Clinical Recommendations
    recommendations = []
    if risk_cat == "High":
        recommendations.append(RECOMMENDATION_RULES["HIGH_RISK"])
    elif risk_cat == "Moderate":
        recommendations.append(RECOMMENDATION_RULES["MODERATE_RISK"])
    else:
        recommendations.append(RECOMMENDATION_RULES["LOW_RISK"])

    if patient.get("hypertension") == 1:
        recommendations.append(RECOMMENDATION_RULES["HYPERTENSION"])
    if float(patient.get("avg_glucose_level", 0.0)) > 140.0:
        recommendations.append(RECOMMENDATION_RULES["HIGH_GLUCOSE"])
    if patient.get("heart_disease") == 1:
        recommendations.append(RECOMMENDATION_RULES["HEART_DISEASE"])
    if float(patient.get("bmi", 0.0)) >= 30.0:
        recommendations.append(RECOMMENDATION_RULES["HIGH_BMI"])
    if patient.get("smoking_status") in ["smokes", "formerly smoked"]:
        recommendations.append(RECOMMENDATION_RULES["SMOKING"])

    output = {
        "disease": "Stroke",
        "probability": risk_pct,
        "risk_category": risk_cat,
        "confidence": confidence_pct,
        "explanation": explanation,
        "recommendations": recommendations
    }

    return output
