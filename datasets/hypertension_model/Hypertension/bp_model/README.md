# Blood Pressure Estimation & Hypertension Screening AI Module

Production-ready Blood Pressure Estimation and Risk Screening module for **Health Sense AI**, a doctor-facing AI-assisted clinical decision support platform.

This module estimates **Systolic Blood Pressure (SBP)** and **Diastolic Blood Pressure (DBP)** from physiological signals (PPG & ECG), classifies AHA/ACC blood pressure stages, estimates Hypertension Risk percentage, and generates a Cardiovascular Risk contribution score.

---

## 📌 Features & Architecture

- **Dataset**: UCI Cuff-Less Blood Pressure Estimation Dataset (`part_1.mat` – `part_12.mat`).
- **Signal Preprocessing (`src/preprocessing.py`)**:
  - Butterworth 4th-order zero-phase bandpass filtering ($0.5 - 8.0\text{ Hz}$ for PPG, $0.5 - 40.0\text{ Hz}$ for ECG).
  - Baseline wander removal and Z-score normalization.
  - 10-second sliding window segmentation with 50% overlap.
  - Physiological range filtering ($40 \le \text{DBP} < \text{SBP} \le 220\text{ mmHg}$) and artifact rejection.
- **Biomedical Feature Engineering (`src/feature_engineering.py`)**:
  - **Time-Domain**: Mean, std, variance, skewness, kurtosis, peak-to-peak amplitude, zero-crossing rate.
  - **Morphology**: Systolic rise time ($T_s$), diastolic decay time ($T_d$), pulse width at 50% height, augmentation index (AIP), pulse area (AUC), perfusion index.
  - **HRV & Timing**: Heart Rate (BPM), Pulse Arrival Time (PAT) transit delay, SDNN, RMSSD, pNN50.
  - **Frequency-Domain**: Low Frequency ($0.04-0.15\text{ Hz}$), High Frequency ($0.15-0.4\text{ Hz}$) spectral power, LF/HF ratio, spectral entropy.
- **Multi-Model Benchmark & Subject-Wise Split (`src/train.py`)**:
  - Subject-wise 80/20 train/test split preventing data leakage across windows of the same subject.
  - Compared regressors: **XGBoost** (Selected Best Architecture), LightGBM, CatBoost, RandomForest.
- **Explainability (`src/explainability.py`)**: SHAP TreeExplainer feature importance attribution.

---

## 📊 Model Performance Metrics

| Metric | Systolic BP (SBP) | Diastolic BP (DBP) | Combined Metric |
| :--- | :---: | :---: | :---: |
| **Selected Architecture** | **XGBoost Regressor** | **XGBoost Regressor** | **XGBoost** |
| **Mean Absolute Error (MAE)** | **`8.299 mmHg`** | **`4.581 mmHg`** | **`6.440 mmHg`** |
| **Root Mean Squared Error (RMSE)** | **`12.713 mmHg`** | **`8.219 mmHg`** | **`10.466 mmHg`** |
| **Mean Absolute Pct Error (MAPE)** | **`6.302 %`** | **`6.900 %`** | **`6.601 %`** |
| **Pearson Correlation ($r$)** | **`0.6498`** | **`0.3679`** | **`0.5088`** |
| **Bland-Altman Mean Bias ($\mu$)** | **`1.137 mmHg`** | **`-0.758 mmHg`** | **`0.189 mmHg`** |
| **95% Limits of Agreement** | **`[-23.68, +25.95]`** | **`[-16.80, +15.28]`** | — |

---

## 📁 Project Directory Structure

```text
bp_model/
├── data/                                      # Data caches & extracted window manifests
├── src/
│   ├── config.py                              # Signal sampling rate (125Hz), thresholds, paths
│   ├── utils.py                               # Logger, seed setting, BP stage classification & risk scoring
│   ├── preprocessing.py                        # Bandpass filtering, baseline wander removal, windowing, SNR check
│   ├── feature_engineering.py                  # Morphological, time-domain, frequency-domain & PAT feature extraction
│   ├── train.py                                # Subject-wise split, multi-model benchmark (XGBoost, LightGBM, CatBoost, RF)
│   ├── evaluate.py                             # MAE, RMSE, MAPE, R2, Pearson r & Bland-Altman statistics
│   ├── explainability.py                       # SHAP feature attribution
│   └── predictor.py                            # Public API exposing load_model() & predict(signal)
├── models/                                     # Exported SBP & DBP model artifacts & metadata
├── outputs/                                    # Evaluation reports & metrics JSON
├── tests/                                      # Pytest unit test suite
├── conftest.py                                 # Pytest path resolution helper
└── README.md                                   # Documentation
```

---

## 🚀 Public Predictor API (`src/predictor.py`)

Exposes ONLY `load_model()` and `predict(signal)` for seamless integration into Health Sense AI backend orchestrator.

```python
from src.predictor import load_model, predict

# 1. Load trained model artifacts into memory
load_model()

# 2. Predict SBP, DBP, and Hypertension Risk from physiological signal
result = predict({
    "ppg": ppg_signal_list_or_array,
    "ecg": ecg_signal_list_or_array
})

print(result)
```

### Standardized JSON Response Schema

```json
{
    "disease": "Hypertension",
    "predicted_sbp": 146,
    "predicted_dbp": 93,
    "blood_pressure_category": "Stage 2 Hypertension",
    "hypertension_probability": 89.4,
    "cardiovascular_contribution": 73.2,
    "confidence": 0.92,
    "explanation": {
        "Pulse Arrival Time (PAT Delay)": 0.38,
        "PPG Mean Level": 0.24,
        "Pulse Width at 50% Peak": 0.20,
        "Sympathovagal Balance (LF/HF)": 0.18
    },
    "recommendations": [
        "Recommend clinical blood pressure confirmation",
        "Prompt medical evaluation and lifestyle modification",
        "Cardiology consultation if clinically indicated"
    ]
}
```

---

## 🧪 Unit Testing

Run the Pytest unit test suite:

```bash
pytest tests/
```

All 6 tests verify signal filtering, normalization, feature extraction, AHA/ACC classification, risk scoring, and public API schema compliance.
