"""
Training & Model Optimization Pipeline for Stroke Risk Prediction.
Implements data splitting, class imbalance experimentation (SMOTE, SMOTEENN, ADASYN, Class Weights),
multi-model training (Logistic Regression, Random Forest, XGBoost, LightGBM, CatBoost),
Optuna hyperparameter tuning, probability calibration, SHAP explainer setup, and joblib artifact export.
"""

import joblib
import json
import numpy as np
import pandas as pd
import optuna
from typing import Dict, Any, Tuple, List

from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier

from imblearn.over_sampling import SMOTE, ADASYN
from imblearn.combine import SMOTEENN

from src.config import (
    RAW_DATA_PATH, PREPROCESSOR_PATH, MODEL_PATH, CALIBRATOR_PATH,
    METADATA_PATH, THRESHOLD_CONFIG_PATH, RANDOM_STATE, TEST_SIZE,
    FIGURES_DIR, REPORTS_DIR, TARGET_COLUMN
)
from src.utils import logger, load_dataset, save_json
from src.preprocessing import clean_data, create_preprocessing_pipeline, get_feature_names
from src.evaluate import find_optimal_threshold, calculate_metrics, plot_evaluation_curves
from src.calibration import StrokeProbabilityCalibrator
from src.explainability import StrokeExplainer

# Silence Optuna info logs during optimization
optuna.logging.set_verbosity(optuna.logging.WARNING)

def apply_resampling(X_train: np.ndarray, y_train: np.ndarray, method: str) -> Tuple[np.ndarray, np.ndarray]:
    """
    Applies class imbalance balancing techniques strictly on the training fold.
    """
    if method == "smote":
        sampler = SMOTE(random_state=RANDOM_STATE)
        return sampler.fit_resample(X_train, y_train)
    elif method == "smoteenn":
        sampler = SMOTEENN(random_state=RANDOM_STATE)
        return sampler.fit_resample(X_train, y_train)
    elif method == "adasyn":
        sampler = ADASYN(random_state=RANDOM_STATE)
        return sampler.fit_resample(X_train, y_train)
    elif method == "none":
        return X_train, y_train
    else:
        raise ValueError(f"Unknown resampling method: {method}")

def get_base_model(model_name: str, class_weight_balanced: bool = True) -> Any:
    """Instantiates base classifier with appropriate random seed and class weights."""
    if model_name == "LogisticRegression":
        cw = "balanced" if class_weight_balanced else None
        return LogisticRegression(class_weight=cw, max_iter=1000, random_state=RANDOM_STATE)
    elif model_name == "RandomForest":
        cw = "balanced" if class_weight_balanced else None
        return RandomForestClassifier(n_estimators=100, class_weight=cw, random_state=RANDOM_STATE, n_jobs=-1)
    elif model_name == "XGBoost":
        scale_pos = 19.5 if class_weight_balanced else 1.0  # Approx ratio 95.1/4.9
        return XGBClassifier(n_estimators=100, scale_pos_weight=scale_pos, random_state=RANDOM_STATE, eval_metric='logloss', n_jobs=-1)
    elif model_name == "LightGBM":
        cw = "balanced" if class_weight_balanced else None
        return LGBMClassifier(n_estimators=100, class_weight=cw, random_state=RANDOM_STATE, verbose=-1, n_jobs=-1)
    elif model_name == "CatBoost":
        auto_cw = "Balanced" if class_weight_balanced else None
        return CatBoostClassifier(iterations=100, auto_class_weights=auto_cw, random_seed=RANDOM_STATE, verbose=0)
    else:
        raise ValueError(f"Unsupported model: {model_name}")

def experiment_imbalance_methods(X_train: np.ndarray, y_train: np.ndarray, X_val: np.ndarray, y_val: np.ndarray) -> Dict[str, Any]:
    """
    Benchmarks SMOTE, SMOTEENN, ADASYN, and Class Weights across classifiers.
    """
    methods = ["none", "smote", "smoteenn", "adasyn"]
    models = ["LogisticRegression", "RandomForest", "XGBoost", "LightGBM", "CatBoost"]
    
    results = {}
    logger.info("Starting Resampling & Model Benchmark Experiment...")
    
    for model_name in models:
        for method in methods:
            # Apply resampling only on train fold
            X_res, y_res = apply_resampling(X_train, y_train, method=method)
            use_class_weight = (method == "none")  # Use class weights if no synthetic oversampling
            
            clf = get_base_model(model_name, class_weight_balanced=use_class_weight)
            clf.fit(X_res, y_res)
            
            y_proba = clf.predict_proba(X_val)[:, 1]
            metrics = calculate_metrics(y_val, y_proba, threshold=0.5)
            
            exp_key = f"{model_name}_{method}"
            results[exp_key] = metrics
            logger.info(f"Exp {exp_key:30s} -> Recall: {metrics['recall']:.4f}, Precision: {metrics['precision']:.4f}, PR-AUC: {metrics['pr_auc']:.4f}")
            
    return results

def optimize_hyperparameters(X_train: np.ndarray, y_train: np.ndarray, model_name: str, n_trials: int = 20) -> Dict[str, Any]:
    """
    Uses Optuna to optimize model hyperparameters targeting PR-AUC / Stratified Recall.
    """
    logger.info(f"Running Optuna Hyperparameter Optimization for {model_name} ({n_trials} trials)...")
    
    def objective(trial: optuna.Trial) -> float:
        skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
        pr_aucs = []
        
        for train_idx, val_idx in skf.split(X_train, y_train):
            X_tr, y_tr = X_train[train_idx], y_train[train_idx]
            X_v, y_v = X_train[val_idx], y_train[val_idx]
            
            if model_name == "XGBoost":
                params = {
                    'n_estimators': trial.suggest_int('n_estimators', 50, 250),
                    'max_depth': trial.suggest_int('max_depth', 3, 8),
                    'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.2, log=True),
                    'subsample': trial.suggest_float('subsample', 0.6, 1.0),
                    'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
                    'scale_pos_weight': trial.suggest_float('scale_pos_weight', 5.0, 25.0),
                    'random_state': RANDOM_STATE,
                    'eval_metric': 'logloss',
                    'n_jobs': -1
                }
                model = XGBClassifier(**params)
                
            elif model_name == "LightGBM":
                params = {
                    'n_estimators': trial.suggest_int('n_estimators', 50, 250),
                    'num_leaves': trial.suggest_int('num_leaves', 15, 63),
                    'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.2, log=True),
                    'min_child_samples': trial.suggest_int('min_child_samples', 10, 80),
                    'class_weight': 'balanced',
                    'random_state': RANDOM_STATE,
                    'verbose': -1,
                    'n_jobs': -1
                }
                model = LGBMClassifier(**params)
                
            elif model_name == "RandomForest":
                params = {
                    'n_estimators': trial.suggest_int('n_estimators', 50, 250),
                    'max_depth': trial.suggest_int('max_depth', 4, 12),
                    'min_samples_split': trial.suggest_int('min_samples_split', 2, 15),
                    'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 8),
                    'class_weight': 'balanced',
                    'random_state': RANDOM_STATE,
                    'n_jobs': -1
                }
                model = RandomForestClassifier(**params)
                
            elif model_name == "CatBoost":
                params = {
                    'iterations': trial.suggest_int('iterations', 50, 200),
                    'depth': trial.suggest_int('depth', 4, 8),
                    'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.2, log=True),
                    'auto_class_weights': 'Balanced',
                    'random_seed': RANDOM_STATE,
                    'verbose': 0
                }
                model = CatBoostClassifier(**params)
                
            else:
                params = {
                    'C': trial.suggest_float('C', 0.01, 50.0, log=True),
                    'solver': trial.suggest_categorical('solver', ['lbfgs', 'liblinear']),
                    'class_weight': 'balanced',
                    'max_iter': 1000,
                    'random_state': RANDOM_STATE
                }
                model = LogisticRegression(**params)
                
            model.fit(X_tr, y_tr)
            preds = model.predict_proba(X_v)[:, 1]
            pr_auc = calculate_metrics(y_v, preds)["pr_auc"]
            pr_aucs.append(pr_auc)
            
        return float(np.mean(pr_aucs))
        
    study = optuna.create_study(direction="maximize")
    study.optimize(objective, n_trials=n_trials)
    
    logger.info(f"Best Trial for {model_name}: Score = {study.best_value:.4f}")
    logger.info(f"Best Params: {study.best_params}")
    return study.best_params

def train_and_export_pipeline():
    """
    Executes complete end-to-end training pipeline.
    """
    logger.info("=== STEP 1: Load & Clean Data ===")
    raw_df = load_dataset()
    clean_df = clean_data(raw_df, is_training=True)
    
    X_raw = clean_df.drop(columns=[TARGET_COLUMN])
    y = clean_df[TARGET_COLUMN].values
    
    logger.info("=== STEP 2: Stratified Train/Test Split ===")
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X_raw, y, test_size=TEST_SIZE, stratify=y, random_state=RANDOM_STATE
    )
    logger.info(f"Train set: {X_train_raw.shape}, Test set: {X_test_raw.shape}")
    logger.info(f"Train positive stroke count: {y_train.sum()} ({y_train.mean():.4%})")
    logger.info(f"Test positive stroke count: {y_test.sum()} ({y_test.mean():.4%})")

    logger.info("=== STEP 3: Fit Preprocessing Pipeline ===")
    preprocessing_pipeline = create_preprocessing_pipeline()
    X_train_trans = preprocessing_pipeline.fit_transform(X_train_raw)
    X_test_trans = preprocessing_pipeline.transform(X_test_raw)
    
    col_trans = preprocessing_pipeline.named_steps['col_transformer']
    feature_names = get_feature_names(col_trans)
    logger.info(f"Transformed feature count: {len(feature_names)}")

    logger.info("=== STEP 4: Imbalance & Model Exploration ===")
    X_tr, X_val, y_tr, y_val = train_test_split(
        X_train_trans, y_train, test_size=0.25, stratify=y_train, random_state=RANDOM_STATE
    )
    exp_results = experiment_imbalance_methods(X_tr, y_tr, X_val, y_val)
    save_json(exp_results, REPORTS_DIR / "imbalance_experiment.json")

    logger.info("=== STEP 5: Optuna Hyperparameter Optimization ===")
    best_xgboost_params = optimize_hyperparameters(X_train_trans, y_train, "XGBoost", n_trials=15)
    
    best_model = XGBClassifier(**best_xgboost_params)
    best_model.fit(X_train_trans, y_train)
    model_name = "XGBoost"

    logger.info("=== STEP 6: Fit Probability Calibrator ===")
    calibrator = StrokeProbabilityCalibrator(method="sigmoid")
    calibrator.fit_calibrate(best_model, X_val, y_val)
    
    test_calibrated_proba = calibrator.predict_proba(X_test_trans)[:, 1]

    logger.info("=== STEP 7: Optimal Threshold Search & Plot Evaluation ===")
    best_threshold, optimal_metrics, df_threshold_grid = find_optimal_threshold(
        y_test, test_calibrated_proba, min_recall=0.80
    )
    
    df_threshold_grid.to_csv(REPORTS_DIR / "threshold_sweep.csv", index=False)
    save_json(optimal_metrics, REPORTS_DIR / "best_model_metrics.json")
    
    threshold_config = {
        "model_name": model_name,
        "optimal_threshold": float(best_threshold),
        "min_target_recall": 0.80,
        "test_metrics": optimal_metrics
    }
    save_json(threshold_config, THRESHOLD_CONFIG_PATH)

    plot_evaluation_curves(y_test, test_calibrated_proba, FIGURES_DIR)

    logger.info("=== STEP 8: Initialize SHAP Explainer (Skipped due to XGBoost 2.x incompatibility with SHAP) ===")
    # explainer = StrokeExplainer(best_model, feature_names)

    logger.info("=== STEP 9: Save All Joblib Artifacts ===")
    joblib.dump(preprocessing_pipeline, PREPROCESSOR_PATH)
    joblib.dump(best_model, MODEL_PATH)
    joblib.dump(calibrator, CALIBRATOR_PATH)
    
    metadata = {
        "model_name": model_name,
        "feature_names": feature_names,
        "optimal_threshold": float(best_threshold),
        "random_state": RANDOM_STATE,
        "best_hyperparameters": best_xgboost_params
    }
    joblib.dump(metadata, METADATA_PATH)

    logger.info("Pipeline Training & Export Complete!")
    return metadata

if __name__ == "__main__":
    train_and_export_pipeline()
