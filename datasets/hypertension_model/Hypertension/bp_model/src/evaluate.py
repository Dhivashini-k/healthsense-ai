"""
Evaluation Module for Blood Pressure Estimation Models.
Calculates MAE, RMSE, MAPE, R2 Score, Pearson Correlation (r),
Bland-Altman Agreement statistics, and prints formatted performance reports.
"""

import numpy as np
import pandas as pd
from scipy.stats import pearsonr
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from typing import Dict, Any, Tuple, Union

try:
    from src.utils import logger
except ImportError:
    from .utils import logger

def calculate_bland_altman_stats(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """
    Computes Bland-Altman agreement metrics:
    - Mean difference (Bias)
    - Standard deviation of difference (SD)
    - Upper Limit of Agreement (LoA Upper = Bias + 1.96 * SD)
    - Lower Limit of Agreement (LoA Lower = Bias - 1.96 * SD)
    """
    diffs = y_pred - y_true
    mean_bias = float(np.mean(diffs))
    sd_bias = float(np.std(diffs))
    upper_loa = float(mean_bias + 1.96 * sd_bias)
    lower_loa = float(mean_bias - 1.96 * sd_bias)
    
    return {
        "mean_bias_mmhg": round(mean_bias, 3),
        "sd_bias_mmhg": round(sd_bias, 3),
        "upper_loa_mmhg": round(upper_loa, 3),
        "lower_loa_mmhg": round(lower_loa, 3)
    }

def calculate_regression_metrics(y_true: np.ndarray, y_pred: np.ndarray, target_name: str = "BP") -> Dict[str, Any]:
    """
    Computes MAE, RMSE, MAPE, R2, Pearson Correlation, and Bland-Altman metrics.
    """
    y_true_arr = np.array(y_true, dtype=float)
    y_pred_arr = np.array(y_pred, dtype=float)

    mae = float(mean_absolute_error(y_true_arr, y_pred_arr))
    rmse = float(np.sqrt(mean_squared_error(y_true_arr, y_pred_arr)))
    
    # Avoid zero division in MAPE
    mape = float(np.mean(np.abs((y_true_arr - y_pred_arr) / np.maximum(y_true_arr, 1.0))) * 100.0)
    r2 = float(r2_score(y_true_arr, y_pred_arr))
    
    if len(y_true_arr) > 1 and np.std(y_true_arr) > 1e-6 and np.std(y_pred_arr) > 1e-6:
        r_val, _ = pearsonr(y_true_arr, y_pred_arr)
        r_val = float(r_val)
    else:
        r_val = 0.0

    ba_stats = calculate_bland_altman_stats(y_true_arr, y_pred_arr)

    return {
        "target": target_name,
        "mae_mmhg": round(mae, 3),
        "rmse_mmhg": round(rmse, 3),
        "mape_percent": round(mape, 3),
        "r2_score": round(r2, 4),
        "pearson_r": round(r_val, 4),
        "bland_altman": ba_stats
    }

def print_evaluation_report(sbp_metrics: Dict[str, Any], dbp_metrics: Dict[str, Any], title: str = "Model Evaluation Report") -> None:
    """Prints a formatted evaluation summary for both SBP and DBP models."""
    logger.info(f"==================================================")
    logger.info(f"=== {title} ===")
    logger.info(f"==================================================")
    
    for metrics in [sbp_metrics, dbp_metrics]:
        t_name = metrics.get("target", "Target")
        logger.info(f"--- {t_name} Regression Performance ---")
        logger.info(f"  Mean Absolute Error (MAE)  : {metrics['mae_mmhg']:.3f} mmHg")
        logger.info(f"  Root Mean Squared Error    : {metrics['rmse_mmhg']:.3f} mmHg")
        logger.info(f"  Mean Absolute Pct Error    : {metrics['mape_percent']:.3f} %")
        logger.info(f"  R² Score (Variance)        : {metrics['r2_score']:.4f}")
        logger.info(f"  Pearson Correlation (r)    : {metrics['pearson_r']:.4f}")
        ba = metrics['bland_altman']
        logger.info(f"  Bland-Altman Bias          : {ba['mean_bias_mmhg']:.3f} mmHg (SD: {ba['sd_bias_mmhg']:.3f})")
        logger.info(f"  Limits of Agreement (95%)  : [{ba['lower_loa_mmhg']:.3f}, {ba['upper_loa_mmhg']:.3f}] mmHg\n")
