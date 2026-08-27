"""
Unit tests for SHAP explainer module.
"""

import pytest
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from src.explainability import StrokeExplainer

def test_stroke_explainer():
    X = np.random.randn(100, 5)
    y = np.random.choice([0, 1], size=100)
    feature_names = ["age", "avg_glucose_level", "bmi", "hypertension", "heart_disease"]
    
    clf = RandomForestClassifier(n_estimators=10, random_state=42).fit(X, y)
    explainer = StrokeExplainer(clf, feature_names)
    
    explanation = explainer.explain_instance(X[:1], top_k=3)
    assert isinstance(explanation, dict)
    assert len(explanation) <= 3
    assert sum(explanation.values()) > 0
