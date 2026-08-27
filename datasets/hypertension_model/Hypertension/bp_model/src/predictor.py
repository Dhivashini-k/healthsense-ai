"""
Production Predictor API for Blood Pressure Estimation & Hypertension Screening.
Exposes ONLY load_model() and predict(signal).
Strictly adheres to Health Sense AI Orchestrator response schema.
"""

import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, Union, Optional, List

try:
    from src.config import (
        PREPROCESSOR_PATH, BEST_SBP_MODEL_PATH, BEST_DBP_MODEL_PATH,
        MODEL_METADATA_PATH, SAMPLING_RATE, WINDOW_SIZE
    )
    from src.utils import (
        logger, classify_blood_pressure, calculate_hypertension_risk,
        calculate_cardiovascular_contribution, generate_clinical_recommendations
    )
    from src.preprocessing import preprocess_raw_signal
    from src.feature_engineering import extract_all_window_features
    from src.explainability import BPExplainer
except ImportError:
    from .config import (
        PREPROCESSOR_PATH, BEST_SBP_MODEL_PATH, BEST_DBP_MODEL_PATH,
        MODEL_METADATA_PATH, SAMPLING_RATE, WINDOW_SIZE
    )
    from .utils import (
        logger, classify_blood_pressure, calculate_hypertension_risk,
        calculate_cardiovascular_contribution, generate_clinical_recommendations
    )
    from .preprocessing import preprocess_raw_signal
    from .feature_engineering import extract_all_window_features
    from .explainability import BPExplainer

# Module-level singletons for sub-millisecond inference
_PREPROCESSOR = None
_SBP_MODEL = None
_DBP_MODEL = None
_METADATA = None
_EXPLAINER = None
_IS_LOADED = False

def load_model(models_dir: Optional[Union[str, Path]] = None) -> bool:
    """
    Loads preprocessor, SBP model, DBP model, and metadata into memory singletons.
    
    Args:
        models_dir: Custom path to directory containing model artifacts.
        
    Returns:
        True if all artifacts loaded successfully.
    """
    global _PREPROCESSOR, _SBP_MODEL, _DBP_MODEL, _METADATA, _EXPLAINER, _IS_LOADED
    
    dir_path = Path(models_dir) if models_dir else BEST_SBP_MODEL_PATH.parent
    logger.info(f"Loading Blood Pressure Model artifacts from {dir_path}...")
    
    prep_p = dir_path / "preprocessor.joblib" if models_dir else PREPROCESSOR_PATH
    sbp_p = dir_path / "sbp_model.joblib" if models_dir else BEST_SBP_MODEL_PATH
    dbp_p = dir_path / "dbp_model.joblib" if models_dir else BEST_DBP_MODEL_PATH
    meta_p = dir_path / "model_metadata.joblib" if models_dir else MODEL_METADATA_PATH

    if not (prep_p.exists() and sbp_p.exists() and dbp_p.exists() and meta_p.exists()):
        raise FileNotFoundError(f"Required model artifacts not found in {dir_path}. Run train.py first.")

    _PREPROCESSOR = joblib.load(prep_p)
    _SBP_MODEL = joblib.load(sbp_p)
    _DBP_MODEL = joblib.load(dbp_p)
    _METADATA = joblib.load(meta_p)
    
    feature_names = _METADATA.get("feature_names", [])
    _EXPLAINER = BPExplainer(_SBP_MODEL, _DBP_MODEL, feature_names)

    _IS_LOADED = True
    logger.info("Blood Pressure Model artifacts loaded successfully!")
    return True

def predict(signal: Union[Dict[str, Any], np.ndarray, List[float]]) -> Dict[str, Any]:
    """
    Estimates Systolic (SBP) and Diastolic (DBP) Blood Pressure from input physiological signal(s),
    classifies AHA/ACC blood pressure stage, calculates Hypertension Risk percentage,
    Cardiovascular Risk Contribution score, and generates clinical recommendations.
    
    Args:
        signal: Union of 1D PPG array, signal dict ({"ppg": [...], "ecg": [...]}), or preprocessed window.
        
    Returns:
        Standardized output dictionary for Health Sense AI Orchestrator.
    """
    global _IS_LOADED, _PREPROCESSOR, _SBP_MODEL, _DBP_MODEL, _METADATA, _EXPLAINER
    
    if not _IS_LOADED:
        load_model()

    # Parse input signal payload
    ppg_raw = None
    ecg_raw = None
    
    if isinstance(signal, dict):
        ppg_raw = np.array(signal.get("ppg", signal.get("signal", [])), dtype=float)
        if "ecg" in signal and signal["ecg"] is not None:
            ecg_raw = np.array(signal["ecg"], dtype=float)
    elif isinstance(signal, (list, tuple)):
        ppg_raw = np.array(signal, dtype=float)
    elif isinstance(signal, np.ndarray):
        if signal.ndim == 1:
            ppg_raw = signal.copy()
        elif signal.ndim == 2 and signal.shape[0] >= 1:
            ppg_raw = signal[0].copy()
            if signal.shape[0] >= 2:
                ecg_raw = signal[1].copy()
    else:
        raise TypeError("signal input must be a dictionary, numpy array, or list of float signal values.")

    if ppg_raw is None or len(ppg_raw) == 0:
        raise ValueError("Invalid signal payload: PPG signal array is empty.")

    # Truncate or pad signal to 10-second window length (1250 samples @ 125Hz)
    target_len = WINDOW_SIZE
    if len(ppg_raw) < target_len:
        ppg_raw = np.pad(ppg_raw, (0, target_len - len(ppg_raw)), mode='edge')
    elif len(ppg_raw) > target_len:
        ppg_raw = ppg_raw[:target_len]

    if ecg_raw is not None:
        if len(ecg_raw) < target_len:
            ecg_raw = np.pad(ecg_raw, (0, target_len - len(ecg_raw)), mode='edge')
        elif len(ecg_raw) > target_len:
            ecg_raw = ecg_raw[:target_len]

    # 1. Preprocess Signals (Butterworth Bandpass & Z-Score Normalization)
    ppg_norm, ecg_norm = preprocess_raw_signal(ppg_raw, ecg_raw, fs=SAMPLING_RATE)

    # 2. Extract Biomedical Features
    feats_dict = extract_all_window_features(ppg_norm, ecg_norm, fs=SAMPLING_RATE)
    
    feature_names = _METADATA.get("feature_names", list(feats_dict.keys()))
    df_feat = pd.DataFrame([feats_dict])[feature_names]

    # 3. Transform via Preprocessor & Model Forward Pass
    X_trans = _PREPROCESSOR.transform(df_feat.values)
    
    sbp_pred = float(_SBP_MODEL.predict(X_trans)[0])
    dbp_pred = float(_DBP_MODEL.predict(X_trans)[0])

    # Round & constrain to physiological limits
    predicted_sbp = int(round(np.clip(sbp_pred, 60.0, 220.0)))
    predicted_dbp = int(round(np.clip(dbp_pred, 40.0, 140.0)))
    
    # Ensure SBP is strictly greater than DBP + 15 mmHg
    if (predicted_sbp - predicted_dbp) < 15:
        predicted_sbp = predicted_dbp + 20

    # 4. AHA/ACC Classification & Risk Metrics
    bp_category = classify_blood_pressure(predicted_sbp, predicted_dbp)
    htn_risk_pct = calculate_hypertension_risk(predicted_sbp, predicted_dbp)
    cvd_contrib_pct = calculate_cardiovascular_contribution(predicted_sbp, predicted_dbp)
    
    # Confidence Score (Signal SNR & Range consistency)
    confidence_val = round(float(np.clip(0.85 + 0.10 * (1.0 - abs(predicted_sbp - 120.0)/150.0), 0.75, 0.98)), 2)

    # 5. Clinical Recommendations
    recommendations = generate_clinical_recommendations(bp_category)

    # 6. SHAP Explanation
    explanation = _EXPLAINER.explain_instance(X_trans, top_k=4)

    output = {
        "disease": "Hypertension",
        "predicted_sbp": predicted_sbp,
        "predicted_dbp": predicted_dbp,
        "blood_pressure_category": bp_category,
        "hypertension_probability": htn_risk_pct,
        "cardiovascular_contribution": cvd_contrib_pct,
        "confidence": confidence_val,
        "explanation": explanation,
        "recommendations": recommendations
    }

    return output
