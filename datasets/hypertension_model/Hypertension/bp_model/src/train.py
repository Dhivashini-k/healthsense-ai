"""
Model Training & Comparison Pipeline for Blood Pressure Estimation.
Loads UCI Cuff-Less dataset (.mat files), performs subject-wise 80/20 split,
extracts biomedical features, benchmarks multi-model regressors (XGBoost, LightGBM, CatBoost, RandomForest),
trains optimal SBP & DBP models, evaluates regression metrics, and exports production artifacts.
"""

import os
import scipy.io as sio
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from typing import Dict, Any, Tuple, List, Optional, Union
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor
from catboost import CatBoostRegressor

try:
    from src.config import (
        DATASET_DIR, MODEL_DIR, REPORTS_DIR,
        PREPROCESSOR_PATH, BEST_SBP_MODEL_PATH, BEST_DBP_MODEL_PATH,
        MODEL_METADATA_PATH, RANDOM_SEED, TEST_SIZE, SAMPLING_RATE,
        MIN_SBP_PHYSIOLOGICAL, MAX_SBP_PHYSIOLOGICAL,
        MIN_DBP_PHYSIOLOGICAL, MAX_DBP_PHYSIOLOGICAL
    )
    from src.utils import logger, set_seed, save_json
    from src.preprocessing import preprocess_raw_signal, is_window_valid
    from src.feature_engineering import extract_all_window_features
    from src.evaluate import calculate_regression_metrics, print_evaluation_report
except ImportError:
    from .config import (
        DATASET_DIR, MODEL_DIR, REPORTS_DIR,
        PREPROCESSOR_PATH, BEST_SBP_MODEL_PATH, BEST_DBP_MODEL_PATH,
        MODEL_METADATA_PATH, RANDOM_SEED, TEST_SIZE, SAMPLING_RATE,
        MIN_SBP_PHYSIOLOGICAL, MAX_SBP_PHYSIOLOGICAL,
        MIN_DBP_PHYSIOLOGICAL, MAX_DBP_PHYSIOLOGICAL
    )
    from .utils import logger, set_seed, save_json
    from .preprocessing import preprocess_raw_signal, is_window_valid
    from .feature_engineering import extract_all_window_features
    from .evaluate import calculate_regression_metrics, print_evaluation_report

def extract_features_and_targets_from_mat(
    mat_path: Union[str, Path], 
    max_subjects: int = 50,
    max_windows_per_subject: int = 15
) -> Tuple[pd.DataFrame, np.ndarray, np.ndarray, np.ndarray]:
    """
    Extracts PPG/ECG feature vectors and ground truth SBP/DBP targets from UCI Cuff-Less .mat file.
    Returns:
        feature_df: DataFrame of extracted features.
        sbp_targets: Array of Systolic BP values.
        dbp_targets: Array of Diastolic BP values.
        subject_ids: Array of subject IDs for subject-wise splitting.
    """
    mat_path = Path(mat_path)
    if not mat_path.exists():
        raise FileNotFoundError(f"UCI dataset file not found at {mat_path}")
        
    mat_data = sio.loadmat(str(mat_path))
    data_cell = mat_data['p']
    n_subjects = min(max_subjects, data_cell.shape[1])
    
    rows = []
    sbp_list = []
    dbp_list = []
    subj_list = []
    
    fs = SAMPLING_RATE
    win_len = int(fs * 10)  # 10s window (1250 samples)
    step_len = int(win_len // 2)  # 50% overlap (625 samples)
    
    for s_idx in range(n_subjects):
        try:
            cell = data_cell[0, s_idx]
            if cell.shape[0] < 3 or cell.shape[1] < win_len:
                continue
                
            ppg_sig = cell[0]  # Channel 0: PPG
            abp_sig = cell[1]  # Channel 1: ABP continuous waveform (mmHg)
            ecg_sig = cell[2]  # Channel 2: ECG
            
            # Preprocess signals
            ppg_norm, ecg_norm = preprocess_raw_signal(ppg_sig, ecg_sig, fs=fs)
            
            # Extract sliding windows
            n_samples = len(ppg_norm)
            win_count = 0
            
            for start_idx in range(0, n_samples - win_len + 1, step_len):
                if win_count >= max_windows_per_subject:
                    break
                    
                end_idx = start_idx + win_len
                ppg_win = ppg_norm[start_idx:end_idx]
                ecg_win = ecg_norm[start_idx:end_idx] if ecg_norm is not None else None
                abp_win = abp_sig[start_idx:end_idx]
                
                # Ground truth SBP & DBP from ABP waveform
                sbp_val = float(np.max(abp_win))
                dbp_val = float(np.min(abp_win))
                
                if not is_window_valid(ppg_win, abp_win, sbp_val, dbp_val):
                    continue
                    
                # Feature extraction
                feats = extract_all_window_features(ppg_win, ecg_win, fs=fs)
                
                rows.append(feats)
                sbp_list.append(sbp_val)
                dbp_list.append(dbp_val)
                subj_list.append(f"{mat_path.stem}_subj_{s_idx}")
                win_count += 1
                
        except Exception as e:
            continue
            
    df_features = pd.DataFrame(rows)
    return df_features, np.array(sbp_list), np.array(dbp_list), np.array(subj_list)

def run_training_pipeline():
    """Executes complete subject-wise training, multi-model benchmark, and artifact export."""
    set_seed(RANDOM_SEED)
    logger.info("=== STEP 1: Load UCI Cuff-Less Dataset & Extract Features ===")
    
    mat_files = list(DATASET_DIR.glob("part_*.mat"))
    if not mat_files:
        raise FileNotFoundError(f"No MAT files found in {DATASET_DIR}")
        
    logger.info(f"Found {len(mat_files)} UCI dataset MAT files.")
    
    # Load feature matrices across available dataset MAT files
    df_all_list, sbp_all_list, dbp_all_list, subj_all_list = [], [], [], []
    
    for mat_file in mat_files[:4]:  # Process subset for optimal training speed & high coverage
        logger.info(f"Extracting features from {mat_file.name}...")
        df_f, sbp_f, dbp_f, subj_f = extract_features_and_targets_from_mat(
            mat_file, max_subjects=60, max_windows_per_subject=10
        )
        if len(df_f) > 0:
            df_all_list.append(df_f)
            sbp_all_list.append(sbp_f)
            dbp_all_list.append(dbp_f)
            subj_all_list.append(subj_f)
            
    df_combined = pd.concat(df_all_list, axis=0).reset_index(drop=True)
    sbp_combined = np.concatenate(sbp_all_list)
    dbp_combined = np.concatenate(dbp_all_list)
    subj_combined = np.concatenate(subj_all_list)
    
    logger.info(f"Extracted total dataset of {len(df_combined)} valid windows across {len(np.unique(subj_combined))} subjects.")

    # STEP 2: Subject-Wise Train/Test Split (80/20)
    unique_subjects = np.unique(subj_combined)
    np.random.shuffle(unique_subjects)
    
    n_test_subjs = int(len(unique_subjects) * TEST_SIZE)
    test_subjs = set(unique_subjects[:n_test_subjs])
    
    train_mask = np.array([s not in test_subjs for s in subj_combined])
    test_mask = np.array([s in test_subjs for s in subj_combined])

    X_train_raw = df_combined[train_mask].values
    X_test_raw = df_combined[test_mask].values
    
    sbp_train, sbp_test = sbp_combined[train_mask], sbp_combined[test_mask]
    dbp_train, dbp_test = dbp_combined[train_mask], dbp_combined[test_mask]
    
    feature_names = df_combined.columns.tolist()
    logger.info(f"Subject-wise split -> Train: {len(X_train_raw)} windows | Test: {len(X_test_raw)} windows")

    # Fit Preprocessing Scaler
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train_raw)
    X_test = scaler.transform(X_test_raw)
    
    joblib.dump(scaler, PREPROCESSOR_PATH)
    logger.info(f"Saved preprocessor scaler to {PREPROCESSOR_PATH}")

    # STEP 3: Multi-Model Benchmark
    logger.info("=== STEP 2: Benchmark Regressors across XGBoost, LightGBM, CatBoost, RandomForest ===")
    
    models = {
        "XGBoost": (
            XGBRegressor(n_estimators=200, learning_rate=0.05, max_depth=6, random_state=RANDOM_SEED, verbosity=0),
            XGBRegressor(n_estimators=200, learning_rate=0.05, max_depth=6, random_state=RANDOM_SEED, verbosity=0)
        ),
        "LightGBM": (
            LGBMRegressor(n_estimators=200, learning_rate=0.05, max_depth=6, random_state=RANDOM_SEED, verbose=-1),
            LGBMRegressor(n_estimators=200, learning_rate=0.05, max_depth=6, random_state=RANDOM_SEED, verbose=-1)
        ),
        "CatBoost": (
            CatBoostRegressor(iterations=250, learning_rate=0.05, depth=6, random_seed=RANDOM_SEED, verbose=0),
            CatBoostRegressor(iterations=250, learning_rate=0.05, depth=6, random_seed=RANDOM_SEED, verbose=0)
        ),
        "RandomForest": (
            RandomForestRegressor(n_estimators=100, max_depth=12, random_state=RANDOM_SEED, n_jobs=-1),
            RandomForestRegressor(n_estimators=100, max_depth=12, random_state=RANDOM_SEED, n_jobs=-1)
        )
    }

    best_combined_mae = float("inf")
    best_model_name = None
    best_sbp_model = None
    best_dbp_model = None

    for name, (m_sbp, m_dbp) in models.items():
        m_sbp.fit(X_train, sbp_train)
        m_dbp.fit(X_train, dbp_train)
        
        pred_sbp = m_sbp.predict(X_test)
        pred_dbp = m_dbp.predict(X_test)
        
        m_sbp_eval = calculate_regression_metrics(sbp_test, pred_sbp, "SBP")
        m_dbp_eval = calculate_regression_metrics(dbp_test, pred_dbp, "DBP")
        
        combined_mae = (m_sbp_eval["mae_mmhg"] + m_dbp_eval["mae_mmhg"]) / 2.0
        logger.info(f"Model '{name}' -> SBP MAE: {m_sbp_eval['mae_mmhg']:.3f} mmHg | DBP MAE: {m_dbp_eval['mae_mmhg']:.3f} mmHg | Combined MAE: {combined_mae:.3f} mmHg")
        
        if combined_mae < best_combined_mae:
            best_combined_mae = combined_mae
            best_model_name = name
            best_sbp_model = m_sbp
            best_dbp_model = m_dbp

    logger.info(f"Selected Best Architecture: '{best_model_name}' (Combined MAE: {best_combined_mae:.3f} mmHg)")

    # Export Best Models & Metadata
    joblib.dump(best_sbp_model, BEST_SBP_MODEL_PATH)
    joblib.dump(best_dbp_model, BEST_DBP_MODEL_PATH)
    
    metadata = {
        "best_architecture": best_model_name,
        "feature_names": feature_names,
        "n_features": len(feature_names),
        "combined_mae": round(best_combined_mae, 3)
    }
    joblib.dump(metadata, MODEL_METADATA_PATH)
    logger.info(f"Saved best model artifacts to {MODEL_DIR}")

    # STEP 4: Final Evaluation & Report Generation
    sbp_pred_final = best_sbp_model.predict(X_test)
    dbp_pred_final = best_dbp_model.predict(X_test)
    
    sbp_final_eval = calculate_regression_metrics(sbp_test, sbp_pred_final, "Systolic Blood Pressure (SBP)")
    dbp_final_eval = calculate_regression_metrics(dbp_test, dbp_pred_final, "Diastolic Blood Pressure (DBP)")
    
    print_evaluation_report(sbp_final_eval, dbp_final_eval, title=f"Blood Pressure Estimation Final Performance ({best_model_name})")
    
    final_metrics_report = {
        "architecture": best_model_name,
        "sbp_metrics": sbp_final_eval,
        "dbp_metrics": dbp_final_eval
    }
    save_json(final_metrics_report, REPORTS_DIR / "final_evaluation_metrics.json")
    logger.info(f"Saved evaluation metrics report to {REPORTS_DIR / 'final_evaluation_metrics.json'}")

if __name__ == "__main__":
    run_training_pipeline()
