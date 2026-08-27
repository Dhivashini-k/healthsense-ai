"""
Evaluation module for Stroke Risk Prediction model.
Calculates clinical metrics, evaluates threshold trade-offs, and plots ROC/PR curves,
calibration diagrams, and feature importances.
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from typing import Dict, Any, Tuple, List, Optional
from sklearn.metrics import (
    recall_score, precision_score, f1_score, roc_auc_score,
    average_precision_score, balanced_accuracy_score, confusion_matrix,
    brier_score_loss, roc_curve, precision_recall_curve, auc
)
from sklearn.calibration import calibration_curve
from src.utils import logger
from src.config import FIGURES_DIR

def calculate_metrics(y_true: np.ndarray, y_pred_proba: np.ndarray, threshold: float = 0.5) -> Dict[str, float]:
    """
    Computes comprehensive classification metrics at a given probability threshold.
    """
    y_pred = (y_pred_proba >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    
    recall = float(recall_score(y_true, y_pred, zero_division=0))
    precision = float(precision_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_true, y_pred_proba))
    pr_auc = float(average_precision_score(y_true, y_pred_proba))
    balanced_acc = float(balanced_accuracy_score(y_true, y_pred))
    specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    brier = float(brier_score_loss(y_true, y_pred_proba))

    return {
        "threshold": round(float(threshold), 4),
        "recall": round(recall, 4),
        "precision": round(precision, 4),
        "f1_score": round(f1, 4),
        "pr_auc": round(pr_auc, 4),
        "roc_auc": round(roc_auc, 4),
        "balanced_accuracy": round(balanced_acc, 4),
        "specificity": round(specificity, 4),
        "brier_score": round(brier, 4),
        "tp": int(tp),
        "fp": int(fp),
        "tn": int(tn),
        "fn": int(fn)
    }

def find_optimal_threshold(
    y_true: np.ndarray, 
    y_pred_proba: np.ndarray, 
    min_recall: float = 0.80,
    grid_steps: int = 100
) -> Tuple[float, Dict[str, float], pd.DataFrame]:
    """
    Searches for the optimal decision threshold balancing Recall and Precision/F1.
    Targeting a clinically reasonable operating point (Recall >= min_recall while maximizing F1).
    """
    thresholds = np.linspace(0.01, 0.99, grid_steps)
    records = []
    
    best_threshold = 0.5
    best_f1 = -1.0
    best_metrics = None
    
    highest_recall_metrics = None
    max_recall_val = -1.0
    
    for th in thresholds:
        m = calculate_metrics(y_true, y_pred_proba, threshold=th)
        records.append(m)
        
        if m["recall"] > max_recall_val:
            max_recall_val = m["recall"]
            highest_recall_metrics = (th, m)
            
        if m["recall"] >= min_recall:
            if m["f1_score"] > best_f1:
                best_f1 = m["f1_score"]
                best_threshold = th
                best_metrics = m
                
    if best_metrics is None:
        best_threshold, best_metrics = highest_recall_metrics
        logger.warning(
            f"No threshold satisfied min_recall={min_recall}. Selected threshold {best_threshold:.4f} "
            f"with recall={best_metrics['recall']:.4f}"
        )
    else:
        logger.info(
            f"Selected optimal clinical threshold: {best_threshold:.4f} "
            f"(Recall: {best_metrics['recall']:.4f}, Precision: {best_metrics['precision']:.4f}, F1: {best_metrics['f1_score']:.4f})"
        )
        
    df_grid = pd.DataFrame(records)
    return best_threshold, best_metrics, df_grid

def plot_evaluation_curves(y_true: np.ndarray, y_pred_proba: np.ndarray, save_dir: Path = FIGURES_DIR) -> None:
    """
    Generates and saves ROC curve, Precision-Recall curve, and Calibration diagram.
    """
    save_dir.mkdir(parents=True, exist_ok=True)
    sns.set_theme(style="whitegrid")
    
    # 1. ROC & PR Curves
    fpr, tpr, _ = roc_curve(y_true, y_pred_proba)
    roc_auc_val = auc(fpr, tpr)
    prec, rec, _ = precision_recall_curve(y_true, y_pred_proba)
    pr_auc_val = auc(rec, prec)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5.5))
    axes[0].plot(fpr, tpr, color='#2ecc71', lw=2.5, label=f'Model ROC-AUC = {roc_auc_val:.4f}')
    axes[0].plot([0, 1], [0, 1], color='gray', linestyle='--')
    axes[0].set_xlabel('False Positive Rate (1 - Specificity)')
    axes[0].set_ylabel('True Positive Rate (Sensitivity)')
    axes[0].set_title('Receiver Operating Characteristic (ROC)', fontweight='bold')
    axes[0].legend(loc='lower right')

    axes[1].plot(rec, prec, color='#9b59b6', lw=2.5, label=f'Model PR-AUC = {pr_auc_val:.4f}')
    baseline = y_true.sum() / len(y_true)
    axes[1].axhline(y=baseline, color='gray', linestyle='--', label=f'Baseline ({baseline:.2%})')
    axes[1].set_xlabel('Recall (Sensitivity)')
    axes[1].set_ylabel('Precision (PPV)')
    axes[1].set_title('Precision-Recall Curve', fontweight='bold')
    axes[1].legend(loc='upper right')
    plt.tight_layout()
    plt.savefig(save_dir / "pr_roc_curves.png")
    plt.close()

    # 2. Reliability Diagram (Calibration Curve)
    prob_true, prob_pred = calibration_curve(y_true, y_pred_proba, n_bins=10, strategy='uniform')
    plt.figure(figsize=(7, 6))
    plt.plot(prob_pred, prob_true, "s-", color='#3498db', label="Calibrated Model")
    plt.plot([0, 1], [0, 1], "k:", label="Perfect Calibration")
    plt.xlabel("Mean Predicted Risk Probability")
    plt.ylabel("Fraction of Positives (Actual Stroke Rate)")
    plt.title("Probability Calibration Reliability Diagram", fontweight='bold')
    plt.legend(loc="lower right")
    plt.tight_layout()
    plt.savefig(save_dir / "calibration_curve.png")
    plt.close()
