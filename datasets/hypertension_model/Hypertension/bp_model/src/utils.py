"""
Utility functions for Blood Pressure Estimation AI Module.
Includes logging, seed setting, AHA/ACC blood pressure classification,
hypertension risk probability estimation, cardiovascular risk contribution scoring,
and clinical recommendation logic.
"""

import json
import logging
import os
import random
import numpy as np
import torch
from pathlib import Path
from typing import Dict, Any, List, Union, Tuple

try:
    from src.config import (
        BP_CATEGORIES, RECOMMENDATION_RULES
    )
except ImportError:
    from .config import (
        BP_CATEGORIES, RECOMMENDATION_RULES
    )

def setup_logger(name: str = "bp_model", level: int = logging.INFO) -> logging.Logger:
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

def set_seed(seed: int = 42) -> None:
    """Fixes random seeds across Python, NumPy, and PyTorch for exact reproducibility."""
    random.seed(seed)
    os.environ['PYTHONHASHSEED'] = str(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False
    logger.info(f"Random seed fixed to {seed}")

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

def classify_blood_pressure(sbp: float, dbp: float) -> str:
    """
    Classifies blood pressure according to AHA/ACC guidelines.
    
    Args:
        sbp: Systolic Blood Pressure (mmHg)
        dbp: Diastolic Blood Pressure (mmHg)
        
    Returns:
        BP Category string (Normal, Elevated, Stage 1, Stage 2, Hypertensive Crisis)
    """
    if sbp >= 180.0 or dbp >= 120.0:
        return BP_CATEGORIES["CRISIS"]
    elif sbp >= 140.0 or dbp >= 90.0:
        return BP_CATEGORIES["STAGE_2"]
    elif sbp >= 130.0 or dbp >= 80.0:
        return BP_CATEGORIES["STAGE_1"]
    elif sbp >= 120.0 and dbp < 80.0:
        return BP_CATEGORIES["ELEVATED"]
    else:
        return BP_CATEGORIES["NORMAL"]

def calculate_hypertension_risk(sbp: float, dbp: float) -> float:
    """
    Calculates estimated Hypertension Risk percentage (0.0 to 100.0%).
    Uses a smooth sigmoid mapping anchored at the clinical threshold (130/80 mmHg).
    """
    # Distance metric from normal/baseline blood pressure (120/80 mmHg)
    dist_sbp = (sbp - 120.0) / 15.0
    dist_dbp = (dbp - 80.0) / 10.0
    
    combined_dist = max(dist_sbp, dist_dbp, (dist_sbp * 0.6 + dist_dbp * 0.4))
    
    # Sigmoidal mapping
    prob = 1.0 / (1.0 + np.exp(-1.8 * (combined_dist - 0.5)))
    risk_pct = round(float(np.clip(prob * 100.0, 1.0, 99.5)), 1)
    return risk_pct

def calculate_cardiovascular_contribution(sbp: float, dbp: float) -> float:
    """
    Estimates blood pressure contribution score (0.0 to 100.0%) to broader Cardiovascular Disease (CVD) risk.
    Higher blood pressure (especially Systolic & Pulse Pressure) increases vascular shear stress.
    """
    pulse_pressure = sbp - dbp
    mean_arterial_pressure = dbp + (pulse_pressure / 3.0)
    
    # Weight MAP and SBP elevation
    map_score = max(0.0, (mean_arterial_pressure - 70.0) / 50.0)
    sbp_score = max(0.0, (sbp - 110.0) / 70.0)
    pp_score = max(0.0, (pulse_pressure - 40.0) / 40.0)
    
    raw_cvd = 0.5 * sbp_score + 0.3 * map_score + 0.2 * pp_score
    cvd_score = round(float(np.clip(raw_cvd * 100.0, 2.0, 98.0)), 1)
    return cvd_score

def generate_clinical_recommendations(bp_category: str) -> List[str]:
    """Generates clinical decision support recommendations for doctors."""
    if bp_category == BP_CATEGORIES["CRISIS"]:
        return RECOMMENDATION_RULES["CRISIS"]
    elif bp_category == BP_CATEGORIES["STAGE_2"]:
        return RECOMMENDATION_RULES["STAGE_2"]
    elif bp_category == BP_CATEGORIES["STAGE_1"]:
        return RECOMMENDATION_RULES["STAGE_1"]
    elif bp_category == BP_CATEGORIES["ELEVATED"]:
        return RECOMMENDATION_RULES["ELEVATED"]
    else:
        return RECOMMENDATION_RULES["NORMAL"]
