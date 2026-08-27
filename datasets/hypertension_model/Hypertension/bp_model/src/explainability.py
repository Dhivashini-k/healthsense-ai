"""
SHAP Explainability Module for Blood Pressure Estimation Models.
Calculates localized feature importance and risk attribution for SBP/DBP predictions.
"""

import shap
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Union

try:
    from src.utils import logger
except ImportError:
    from .utils import logger

FEATURE_DISPLAY_NAMES = {
    "ppg_mean": "PPG Mean Level",
    "ppg_std": "PPG Amplitude Variability",
    "ppg_var": "PPG Signal Variance",
    "ppg_skew": "PPG Waveform Skewness",
    "ppg_kurt": "PPG Waveform Kurtosis",
    "ppg_p2p": "PPG Peak-to-Peak Amplitude",
    "ppg_zcr": "Zero-Crossing Rate",
    "systolic_time": "Systolic Rise Time (T_s)",
    "diastolic_time": "Diastolic Decay Time (T_d)",
    "pulse_width_50": "Pulse Width at 50% Peak",
    "augmentation_index": "Augmentation Index (AIP)",
    "perfusion_index": "Perfusion Index",
    "auc_sys": "Systolic Area Under Curve",
    "auc_dia": "Diastolic Area Under Curve",
    "sys_dia_ratio": "Systolic/Diastolic Area Ratio",
    "heart_rate_bpm": "Heart Rate (BPM)",
    "hrv_sdnn": "Heart Rate Variability (SDNN)",
    "hrv_rmssd": "HRV Successive Differences (RMSSD)",
    "hrv_pnn50": "HRV High-Frequency Proportion (pNN50)",
    "pat_mean_ms": "Pulse Arrival Time (PAT Delay)",
    "pat_std_ms": "PAT Delay Variance",
    "spec_lf_power": "Low-Frequency Spectral Power",
    "spec_hf_power": "High-Frequency Spectral Power",
    "spec_lf_hf_ratio": "Sympathovagal Balance (LF/HF)",
    "spec_entropy": "Spectral Signal Entropy"
}

class BPExplainer:
    """
    SHAP-based feature importance explainer for SBP and DBP regression models.
    """
    def __init__(self, sbp_model: Any, dbp_model: Any, feature_names: List[str]):
        self.sbp_model = sbp_model
        self.dbp_model = dbp_model
        self.feature_names = feature_names

        try:
            self.sbp_explainer = shap.TreeExplainer(sbp_model)
        except Exception:
            self.sbp_explainer = shap.Explainer(sbp_model)
            
        try:
            self.dbp_explainer = shap.TreeExplainer(dbp_model)
        except Exception:
            self.dbp_explainer = shap.Explainer(dbp_model)
            
        logger.info("Initialized SHAP BP Explainer successfully.")

    def explain_instance(self, X_features: Union[np.ndarray, pd.DataFrame], top_k: int = 4) -> Dict[str, float]:
        """
        Generates normalized localized feature contribution proportions for top K influential features.
        
        Returns:
            Dictionary mapping feature display name -> relative contribution proportion (e.g., {"Pulse Arrival Time (PAT Delay)": 0.38})
        """
        if isinstance(X_features, pd.DataFrame):
            X_arr = X_features.values
        else:
            X_arr = np.array(X_features)
            
        if len(X_arr.shape) == 1:
            X_arr = X_arr.reshape(1, -1)

        sbp_shap = self.sbp_explainer.shap_values(X_arr)[0]
        dbp_shap = self.dbp_explainer.shap_values(X_arr)[0]
        
        # Combine absolute SHAP impacts for SBP and DBP
        combined_impact = np.abs(sbp_shap) * 0.6 + np.abs(dbp_shap) * 0.4
        
        # Map feature names to clean display names
        feature_scores = {}
        for feat_name, score in zip(self.feature_names, combined_impact):
            display = FEATURE_DISPLAY_NAMES.get(feat_name, feat_name.replace("_", " ").title())
            feature_scores[display] = float(score)

        sorted_feats = sorted(feature_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
        
        total_score = sum(val for _, val in sorted_feats)
        if total_score == 0:
            total_score = 1.0

        explanation_dict = {
            feat: round(val / total_score, 2)
            for feat, val in sorted_feats
        }

        return explanation_dict
