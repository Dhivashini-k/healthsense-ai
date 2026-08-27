"""
Utility functions for Stroke Risk Prediction AI module.
Provides logging setup, dataset loading, and clinical recommendation generation logic.
"""

import json
import logging
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List, Union

try:
    from src.config import RAW_DATA_PATH, RECOMMENDATION_RULES
except ImportError:
    from .config import RAW_DATA_PATH, RECOMMENDATION_RULES

def setup_logger(name: str = "stroke_model", level: int = logging.INFO) -> logging.Logger:
    """Configures standardized logging output for console execution."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(level)
        formatter = logging.Formatter(
            '[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        ch = logging.StreamHandler()
        ch.setFormatter(formatter)
        logger.addHandler(ch)
    return logger

logger = setup_logger()

def load_dataset(data_path: Union[str, Path] = RAW_DATA_PATH) -> pd.DataFrame:
    """
    Loads raw healthcare stroke dataset into pandas DataFrame.
    """
    path = Path(data_path)
    if not path.exists():
        raise FileNotFoundError(f"Raw stroke dataset not found at {path}")
    logger.info(f"Loading dataset from {path}")
    return pd.read_csv(path)

def save_json(data: Dict[str, Any], filepath: Union[str, Path]) -> None:
    """Saves dictionary to JSON file."""
    path = Path(filepath)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

def load_json(filepath: Union[str, Path]) -> Dict[str, Any]:
    """Loads JSON file into dictionary."""
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

def generate_clinical_recommendations(
    risk_category: str, 
    patient: Dict[str, Any]
) -> List[str]:
    """
    Generates actionable clinical recommendations based on predicted risk category
    and specific clinical risk factors.
    """
    recommendations = []
    
    # 1. Primary Risk Recommendation
    if risk_category == "High":
        recommendations.append(RECOMMENDATION_RULES["HIGH_RISK"])
    elif risk_category == "Moderate":
        recommendations.append(RECOMMENDATION_RULES["MODERATE_RISK"])
    else:
        recommendations.append(RECOMMENDATION_RULES["LOW_RISK"])
        
    # 2. Risk Factor Specific Recommendations
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
        
    return recommendations
