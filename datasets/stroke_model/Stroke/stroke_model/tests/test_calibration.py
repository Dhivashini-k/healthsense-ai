"""
Unit tests for probability calibrator.
"""

import pytest
import numpy as np
from sklearn.linear_model import LogisticRegression
from src.calibration import StrokeProbabilityCalibrator

def test_stroke_probability_calibrator():
    X = np.random.randn(200, 5)
    y = np.random.choice([0, 1], size=200, p=[0.9, 0.1])
    
    clf = LogisticRegression().fit(X[:150], y[:150])
    calibrator = StrokeProbabilityCalibrator(method="sigmoid")
    calibrator.fit_calibrate(clf, X[150:], y[150:])
    
    probs = calibrator.predict_proba(X[150:])
    assert probs.shape == (50, 2)
    assert (probs >= 0.0).all() and (probs <= 1.0).all()
    
    metrics = calibrator.evaluate_calibration(X[150:], y[150:])
    assert "brier_score" in metrics
    assert "prob_true" in metrics
    assert "prob_pred" in metrics
