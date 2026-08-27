"""
SHAP Explainability module for Stroke Risk Prediction model.
Calculates localized feature importance and feature risk contribution values for individual patient predictions.
"""

import shap
import numpy as np
import pandas as pd
from typing import Dict, Any, List

try:
    from src.utils import logger
    from src.config import FEATURE_NAME_MAP
except ImportError:
    from .utils import logger
    from .config import FEATURE_NAME_MAP

class StrokeExplainer:
    """
    SHAP-based feature importance explainer for doctor-facing clinical decision support.
    """
    def __init__(self, model: Any, feature_names: List[str]):
        """
        Initializes SHAP Explainer for the trained model.
        """
        self.model = model
        self.feature_names = feature_names
        
        # Initialize SHAP TreeExplainer or generic Explainer
        try:
            self.explainer = shap.TreeExplainer(model)
        except Exception:
            self.explainer = shap.Explainer(model)
            
        logger.info("Initialized SHAP Explainer successfully.")

    def explain_instance(self, X_transformed: np.ndarray, top_k: int = 4) -> Dict[str, float]:
        """
        Generates normalized localized feature contribution percentages for a single patient record.
        
        Returns:
            Dictionary mapping clinical concept name -> contribution share (e.g., {"Age": 0.24, "Hypertension": 0.17})
        """
        if len(X_transformed.shape) == 1:
            X_transformed = X_transformed.reshape(1, -1)

        shap_values = self.explainer.shap_values(X_transformed)
        
        # Handle multi-class vs binary output shapes
        if isinstance(shap_values, list):
            # Class 1 (positive stroke class) shap values
            vals = np.abs(shap_values[1][0])
        elif len(shap_values.shape) == 3:
            vals = np.abs(shap_values[0, :, 1])
        else:
            vals = np.abs(shap_values[0])

        # Aggregate one-hot encoded category contributions into parent feature names
        aggregated_scores: Dict[str, float] = {}
        
        for raw_feat_name, val in zip(self.feature_names, vals):
            # Map raw pipeline feature name (e.g., num__age, cat__work_type_Private) to clinical name
            mapped_name = None
            for key, display_name in FEATURE_NAME_MAP.items():
                if key in raw_feat_name:
                    mapped_name = display_name
                    break
            if mapped_name is None:
                mapped_name = raw_feat_name.replace("num__", "").replace("cat__", "").replace("_", " ").title()

            aggregated_scores[mapped_name] = aggregated_scores.get(mapped_name, 0.0) + float(val)

        # Sort by impact
        sorted_features = sorted(aggregated_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
        
        total_impact = sum(val for _, val in sorted_features)
        if total_impact == 0:
            total_impact = 1.0

        # Normalize into relative proportion (e.g. 0.24, 0.17, 0.14)
        explanation_dict = {
            feat: round(val / total_impact, 2)
            for feat, val in sorted_features
        }
        
        return explanation_dict
