"""
Unit tests for data cleaning and preprocessing pipeline.
"""

import pytest
import pandas as pd
import numpy as np

from src.utils import load_dataset
from src.preprocessing import clean_data, create_preprocessing_pipeline, ClinicalFeatureAdder

def test_clean_data():
    raw_df = load_dataset()
    cleaned = clean_data(raw_df, is_training=True)
    
    assert "id" not in cleaned.columns
    assert (cleaned["gender"] == "Other").sum() == 0
    assert len(cleaned) <= len(raw_df)

def test_clinical_feature_adder():
    sample_df = pd.DataFrame([{
        "avg_glucose_level": 180.0,
        "bmi": 30.0,
        "hypertension": 1,
        "heart_disease": 0
    }])
    adder = ClinicalFeatureAdder()
    transformed = adder.transform(sample_df)
    
    assert "glucose_bmi_ratio" in transformed.columns
    assert "high_glucose_flag" in transformed.columns
    assert "metabolic_risk_score" in transformed.columns
    
    assert transformed["high_glucose_flag"].iloc[0] == 1.0
    assert transformed["metabolic_risk_score"].iloc[0] == 3.0  # hyper(1) + glucose(1) + bmi>=30(1)

def test_preprocessing_pipeline_fit_transform():
    raw_df = load_dataset()
    cleaned = clean_data(raw_df, is_training=True)
    X = cleaned.drop(columns=["stroke"])
    
    pipeline = create_preprocessing_pipeline()
    X_trans = pipeline.fit_transform(X)
    
    assert isinstance(X_trans, np.ndarray)
    assert X_trans.shape[0] == len(cleaned)
    assert X_trans.shape[1] == 23  # Expected transformed features count
    assert not np.isnan(X_trans).any()
