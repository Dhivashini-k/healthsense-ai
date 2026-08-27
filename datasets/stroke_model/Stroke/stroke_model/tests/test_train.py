"""
Unit tests for model training and class imbalance handling.
"""

import pytest
import numpy as np
from src.train import apply_resampling, get_base_model

def test_apply_resampling():
    np.random.seed(42)
    X_train = np.random.randn(100, 10)
    y_train = np.array([0] * 90 + [1] * 10)
    
    X_smote, y_smote = apply_resampling(X_train, y_train, method="smote")
    assert len(X_smote) > len(X_train)
    assert y_smote.sum() == (y_smote == 0).sum()
    
    X_none, y_none = apply_resampling(X_train, y_train, method="none")
    assert len(X_none) == len(X_train)

def test_get_base_model():
    models = ["LogisticRegression", "RandomForest", "XGBoost", "LightGBM", "CatBoost"]
    for m in models:
        clf = get_base_model(m, class_weight_balanced=True)
        assert clf is not None
        assert hasattr(clf, "fit")
        assert hasattr(clf, "predict_proba")
