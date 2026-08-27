"""
Unit Test Suite for Blood Pressure Estimation AI Module.
Tests signal preprocessing, feature extraction, AHA/ACC classification,
hypertension risk scoring, and public predictor API schema compliance.
"""

import pytest
import numpy as np
from pathlib import Path

from src.config import SAMPLING_RATE, WINDOW_SIZE, BP_CATEGORIES
from src.preprocessing import filter_ppg, filter_ecg, normalize_signal, is_window_valid
from src.feature_engineering import extract_all_window_features
from src.utils import classify_blood_pressure, calculate_hypertension_risk, calculate_cardiovascular_contribution
from src.predictor import load_model, predict

@pytest.fixture(scope="module")
def sample_signals():
    """Generates synthetic 10-second PPG and ECG signals @ 125Hz for testing."""
    t = np.linspace(0, 10, WINDOW_SIZE)
    # Synthetic PPG (1.2 Hz pulse ~ 72 bpm)
    ppg = np.sin(2 * np.pi * 1.2 * t) + 0.3 * np.sin(4 * np.pi * 1.2 * t) + 0.05 * np.random.randn(WINDOW_SIZE)
    # Synthetic ECG
    ecg = np.sin(2 * np.pi * 1.2 * t) + 0.8 * np.sin(6 * np.pi * 1.2 * t)
    return ppg, ecg

def test_preprocessing_and_normalization(sample_signals):
    ppg, ecg = sample_signals
    filtered_ppg = filter_ppg(ppg, fs=SAMPLING_RATE)
    norm_ppg = normalize_signal(filtered_ppg)
    
    assert len(filtered_ppg) == WINDOW_SIZE
    assert len(norm_ppg) == WINDOW_SIZE
    assert abs(np.mean(norm_ppg)) < 1e-5
    assert abs(np.std(norm_ppg) - 1.0) < 1e-3
    assert is_window_valid(norm_ppg, sbp=120.0, dbp=80.0) is True

def test_feature_extraction(sample_signals):
    ppg, ecg = sample_signals
    feats = extract_all_window_features(ppg, ecg, fs=SAMPLING_RATE)
    
    assert isinstance(feats, dict)
    assert len(feats) > 15
    assert "heart_rate_bpm" in feats
    assert "systolic_time" in feats
    assert "spec_lf_hf_ratio" in feats
    assert not any(np.isnan(v) for v in feats.values())

def test_blood_pressure_classification():
    assert classify_blood_pressure(115, 75) == BP_CATEGORIES["NORMAL"]
    assert classify_blood_pressure(125, 78) == BP_CATEGORIES["ELEVATED"]
    assert classify_blood_pressure(135, 85) == BP_CATEGORIES["STAGE_1"]
    assert classify_blood_pressure(145, 92) == BP_CATEGORIES["STAGE_2"]
    assert classify_blood_pressure(185, 125) == BP_CATEGORIES["CRISIS"]

def test_risk_and_cvd_contribution_scoring():
    htn_risk = calculate_hypertension_risk(146, 93)
    cvd_score = calculate_cardiovascular_contribution(146, 93)
    
    assert 0.0 <= htn_risk <= 100.0
    assert 0.0 <= cvd_score <= 100.0
    assert htn_risk > 50.0  # Stage 2 should yield elevated risk

def test_predictor_api_load_and_predict(sample_signals):
    ppg, ecg = sample_signals
    
    # 1. Load model artifacts
    loaded = load_model()
    assert loaded is True
    
    # 2. Test prediction on dict input
    payload = {"ppg": ppg.tolist(), "ecg": ecg.tolist()}
    res = predict(payload)
    
    assert res["disease"] == "Hypertension"
    assert isinstance(res["predicted_sbp"], int)
    assert isinstance(res["predicted_dbp"], int)
    assert 50 <= res["predicted_sbp"] <= 220
    assert 35 <= res["predicted_dbp"] <= 140
    assert res["blood_pressure_category"] in BP_CATEGORIES.values()
    assert 0.0 <= res["hypertension_probability"] <= 100.0
    assert 0.0 <= res["cardiovascular_contribution"] <= 100.0
    assert 0.0 <= res["confidence"] <= 1.0
    assert isinstance(res["explanation"], dict)
    assert isinstance(res["recommendations"], list)
    assert len(res["recommendations"]) > 0

def test_predictor_api_array_input(sample_signals):
    ppg, _ = sample_signals
    res = predict(ppg)
    assert res["disease"] == "Hypertension"
    assert res["predicted_sbp"] > 0
    assert res["predicted_dbp"] > 0
