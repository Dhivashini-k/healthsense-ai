"""
Probability calibration module for Stroke Risk Prediction.
Supports Platt Scaling (Sigmoid) and Isotonic Regression calibration wrappers.
Compatible with all scikit-learn versions (including 1.6+ FrozenEstimator).
"""

import numpy as np
from typing import Tuple, Dict, Any
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import brier_score_loss

try:
    from src.utils import logger
except ImportError:
    from .utils import logger

class StrokeProbabilityCalibrator:
    """
    Calibrates raw model probability outputs to yield reliable, well-calibrated risk percentages.
    """
    def __init__(self, method: str = "isotonic"):
        """
        method: 'isotonic' or 'sigmoid' (Platt scaling)
        """
        if method not in ["isotonic", "sigmoid"]:
            raise ValueError("Calibration method must be 'isotonic' or 'sigmoid'.")
        self.method = method
        self.calibrator = None

    def fit_calibrate(
        self, 
        estimator: Any, 
        X_val: np.ndarray, 
        y_val: np.ndarray
    ) -> "StrokeProbabilityCalibrator":
        """
        Fits calibration model on validation/calibration set.
        """
        logger.info(f"Fitting probability calibrator using method='{self.method}'")
        try:
            from sklearn.frozen import FrozenEstimator
            frozen_model = FrozenEstimator(estimator)
            self.calibrator = CalibratedClassifierCV(
                estimator=frozen_model,
                method=self.method
            )
        except ImportError:
            # Fallback for sklearn < 1.6
            self.calibrator = CalibratedClassifierCV(
                estimator=estimator,
                method=self.method,
                cv="prefit"
            )
            
        self.calibrator.fit(X_val, y_val)
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Returns calibrated probabilities array of shape (n_samples, 2).
        """
        if self.calibrator is None:
            raise ValueError("Calibrator has not been fitted yet.")
        return self.calibrator.predict_proba(X)

    def evaluate_calibration(self, X: np.ndarray, y_true: np.ndarray, n_bins: int = 10) -> Dict[str, Any]:
        """
        Evaluates Brier score loss and computes calibration curve coordinates.
        """
        probs = self.predict_proba(X)[:, 1]
        brier = brier_score_loss(y_true, probs)
        prob_true, prob_pred = calibration_curve(y_true, probs, n_bins=n_bins, strategy='uniform')
        
        return {
            "brier_score": float(brier),
            "prob_true": prob_true.tolist(),
            "prob_pred": prob_pred.tolist()
        }
