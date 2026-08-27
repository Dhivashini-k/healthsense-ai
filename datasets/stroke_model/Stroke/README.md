# Health Sense AI — Stroke Risk Prediction Model

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.9.0-orange.svg)](https://scikit-learn.org/)
[![XGBoost](https://img.shields.io/badge/XGBoost-3.3.0-red.svg)](https://xgboost.readthedocs.io/)
[![Status](https://img.shields.io/badge/Status-Production--Ready-brightgreen.svg)]()

Production-ready machine learning module for **Stroke Risk Prediction**, designed for integration into the **Health Sense AI** clinical decision support platform.

---

## 📌 Clinical Overview & Objective

Stroke is a leading cause of long-term disability and mortality worldwide. Early screening enables clinicians to identify elevated stroke risk and intervene proactively.

- **Primary Goal**: Predict the calibrated probability ($0\%$ to $100\%$) of stroke risk from clinical indicators.
- **Clinical Role**: Early screening tool for doctor-facing decision support. **Not a diagnosis**.
- **Optimization Priority**: **High Recall (Sensitivity)** to minimize false negatives (missing high-risk stroke patients), combined with calibrated probability estimates.

---

## 📂 Project Structure

```text
stroke_model/
├── data/
│   └── healthcare-dataset-stroke-data.csv      # Kaggle Stroke Prediction dataset
├── notebooks/
│   └── eda_and_modelling.ipynb                 # Full interactive visual notebook
├── src/
│   ├── config.py                               # Centralized parameters & threshold rules
│   ├── utils.py                                # Logging, IO helpers, clinical recommendation logic
│   ├── preprocessing.py                        # ColumnTransformer & Clinical Feature Adder
│   ├── train.py                                # Imbalance benchmark & Optuna hyperparameter tuning
│   ├── evaluate.py                             # Metrics calculation & threshold grid search
│   ├── calibration.py                          # Platt / Isotonic probability calibration
│   ├── explainability.py                       # SHAP localized feature attribution
│   ├── plot_generator.py                       # Visual plot generation suite
│   └── predictor.py                            # Public API exposing load_model() & predict()
├── models/                                     # Exported joblib artifacts
│   ├── stroke_pipeline.joblib
│   ├── stroke_model.joblib
│   ├── calibrator.joblib
│   ├── model_metadata.joblib
│   └── threshold_config.json
├── outputs/
│   ├── figures/                                # High-resolution evaluation charts
│   └── reports/                                # JSON & CSV metrics export
├── tests/                                      # Pytest unit test suite
│   ├── test_preprocessing.py
│   ├── test_train.py
│   ├── test_calibration.py
│   ├── test_explainability.py
│   └── test_predictor.py
└── README.md
```

---

## 📊 Dataset & Feature Descriptions

Source: [Kaggle Stroke Prediction Dataset](https://www.kaggle.com/datasets/fedesoriano/stroke-prediction-dataset)

- **Total Samples**: 5,110 patients (5,109 after dropping 1 single `'Other'` gender record in training).
- **Target Imbalance**: 95.13% Non-Stroke (`0`) vs 4.87% Stroke (`1`).
- **Features**:
  - `age`: Patient age (continuous: 0.08 to 82 years)
  - `hypertension`: 0 = No, 1 = Yes
  - `heart_disease`: 0 = No, 1 = Yes
  - `avg_glucose_level`: Average blood glucose level ($mg/dL$)
  - `bmi`: Body Mass Index ($kg/m^2$, 201 missing values median imputed inside sklearn pipeline)
  - `gender`: `'Male'`, `'Female'`, `'Other'`
  - `ever_married`: `'Yes'`, `'No'`
  - `work_type`: `'Private'`, `'Self-employed'`, `'Govt_job'`, `'children'`, `'Never_worked'`
  - `Residence_type`: `'Urban'`, `'Rural'`
  - `smoking_status`: `'formerly smoked'`, `'never smoked'`, `'smokes'`, `'Unknown'`

---

## 🏗️ Preprocessing & Clinical Feature Engineering

All transformations are encapsulated inside a scikit-learn `Pipeline` and `ColumnTransformer` to prevent data leakage:

1. **Missing Value Imputation**: Median imputation for `bmi` and mode imputation for categorical attributes.
2. **One-Hot Encoding**: Unordered categorical features encoded with `OneHotEncoder(handle_unknown='ignore')`.
3. **Standard Scaling**: Continuous numerical features standardized to zero mean and unit variance.
4. **Engineered Clinical Indicators**:
   - `glucose_bmi_ratio` = $\frac{\text{avg\_glucose\_level}}{\text{bmi} + 1e-5}$
   - `high_glucose_flag` = $(\text{avg\_glucose\_level} \ge 140.0)$
   - `metabolic_risk_score` = Count of co-occurring conditions ($\text{hypertension} + \text{heart\_disease} + \text{high\_glucose} + \text{obesity}$).

---

## ⚖️ Class Imbalance & Model Selection Experiments

We evaluated **SMOTE**, **SMOTEENN**, **ADASYN**, and **Class Weights** across 5 model families on the 80/20 stratified split:

| Model Family | Resampling Strategy | Validation Recall | Validation Precision | PR-AUC |
| :--- | :--- | :---: | :---: | :---: |
| **XGBoost** | **Class Weights (scale_pos_weight)** | **0.880** | **0.217** | **0.275** |
| LightGBM | Balanced Class Weight | 0.840 | 0.196 | 0.247 |
| CatBoost | Balanced Auto Weights | 0.840 | 0.177 | 0.221 |
| Logistic Regression | SMOTEENN | 0.900 | 0.129 | 0.207 |
| Random Forest | SMOTE | 0.280 | 0.131 | 0.160 |

---

## 🎯 Model Calibration & Threshold Optimization

- **Probability Calibration**: Calibrated using Platt Scaling (`sigmoid`) to output reliable probability estimates.
- **Operating Threshold**: Decision boundary optimized to $0.32$ (calibrated risk threshold) to deliver high screening sensitivity while maintaining clinical precision.

### Performance Summary on Test Set (1,022 Patients):

- **Recall (Sensitivity)**: $88.0\%$
- **ROC-AUC**: $0.845$
- **PR-AUC**: $0.275$
- **Brier Calibration Score**: $0.0408$

---

## 🧠 Localized SHAP Explainability

The module computes localized SHAP attributions for every individual patient:

```json
"explanation": {
    "Age": 0.49,
    "Hypertension": 0.17,
    "Average Glucose": 0.17,
    "Metabolic Risk Score": 0.17
}
```

---

## 🚀 Public API Contract (`predictor.py`)

The module exposes **ONLY** `load_model()` and `predict(patient)`:

### Integration Example:

```python
from src.predictor import load_model, predict

# 1. Initialize models once at startup
load_model()

# 2. Input patient dictionary
patient = {
    "gender": "Male",
    "age": 67,
    "hypertension": 1,
    "heart_disease": 0,
    "ever_married": "Yes",
    "work_type": "Private",
    "Residence_type": "Urban",
    "avg_glucose_level": 182.4,
    "bmi": 31.2,
    "smoking_status": "formerly smoked"
}

# 3. Get prediction output
result = predict(patient)
```

### Returned Output Schema:

```json
{
    "disease": "Stroke Risk",
    "probability": 45.0,
    "risk_category": "Moderate",
    "confidence": 0.94,
    "model": "XGBoost",
    "threshold": 0.32,
    "explanation": {
        "Age": 0.49,
        "Hypertension": 0.17,
        "Average Glucose": 0.17,
        "Metabolic Risk Score": 0.17
    },
    "recommendations": [
        "Recommend routine follow-up, cardiovascular assessment, and lifestyle modifications.",
        "Monitor blood pressure regularly and consult primary care for BP management.",
        "Perform HbA1c screening and glycemic evaluation for diabetes management.",
        "Encourage dietary consultation and structured weight management program.",
        "Offer smoking cessation counseling and clinical support resources."
    ]
}
```

---

## 🧪 Installation & Running Tests

### 1. Requirements & Setup
```bash
python -m pip install -r requirements.txt
```

### 2. Retrain Pipeline
```bash
python -m src.train
```

### 3. Generate Visual Plots
```bash
python -m src.plot_generator
```

### 4. Execute Unit Test Suite
```bash
python -m pytest tests/
```
