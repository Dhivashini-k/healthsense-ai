"""
Preprocessing and Clinical Feature Engineering Pipeline.
Handles missing data imputation, continuous feature scaling, categorical one-hot encoding,
and domain-specific clinical feature engineering.
"""

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from typing import Tuple, List

try:
    from src.config import (
        NUMERICAL_FEATURES, CATEGORICAL_FEATURES, BINARY_FEATURES,
        ID_COLUMN, TARGET_COLUMN
    )
except ImportError:
    from .config import (
        NUMERICAL_FEATURES, CATEGORICAL_FEATURES, BINARY_FEATURES,
        ID_COLUMN, TARGET_COLUMN
    )

class ClinicalFeatureAdder(BaseEstimator, TransformerMixin):
    """
    Custom Scikit-Learn Transformer to engineer clinical risk indicators:
    1. glucose_bmi_ratio: Ratio of average glucose level to BMI.
    2. high_glucose_flag: Binary flag for glucose >= 140 mg/dL (prediabetes/diabetes threshold).
    3. metabolic_risk_score: Composite score combining hypertension, heart disease, high glucose, and high BMI.
    """
    def __init__(self):
        pass

    def fit(self, X: pd.DataFrame, y=None):
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        X_out = X.copy()
        
        # Avoid division by zero
        bmi_safe = np.where(X_out['bmi'].values == 0, np.nan, X_out['bmi'].values)
        X_out['glucose_bmi_ratio'] = X_out['avg_glucose_level'].values / bmi_safe
        X_out['glucose_bmi_ratio'] = X_out['glucose_bmi_ratio'].fillna(0.0)
        
        # High Glucose Flag (Hyperglycemia indicator)
        X_out['high_glucose_flag'] = (X_out['avg_glucose_level'].values >= 140.0).astype(int)
        
        # Composite Metabolic Risk Score
        high_bmi = (X_out['bmi'].values >= 30.0).astype(int)
        X_out['metabolic_risk_score'] = (
            X_out['hypertension'].values +
            X_out['heart_disease'].values +
            X_out['high_glucose_flag'].values +
            high_bmi
        )
        
        return X_out

def clean_data(df: pd.DataFrame, is_training: bool = True) -> pd.DataFrame:
    """
    Cleans raw dataset, drops ID column, filters invalid gender records ('Other'),
    and handles missing values appropriately.
    """
    df_clean = df.copy()
    if ID_COLUMN in df_clean.columns:
        df_clean = df_clean.drop(columns=[ID_COLUMN])
        
    # Drop rare 'Other' gender entry if present during training
    if is_training and 'gender' in df_clean.columns:
        df_clean = df_clean[df_clean['gender'] != 'Other'].reset_index(drop=True)
        
    return df_clean

def create_preprocessing_pipeline() -> Pipeline:
    """
    Constructs scikit-learn ColumnTransformer preprocessing pipeline.
    Applies median imputation & scaling to numerical features,
    and One-Hot Encoding to categorical features.
    """
    all_numerical = NUMERICAL_FEATURES + ["glucose_bmi_ratio", "metabolic_risk_score"]
    
    num_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    cat_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('ohe', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    passthrough_features = BINARY_FEATURES + ["high_glucose_flag"]
    
    col_transformer = ColumnTransformer(transformers=[
        ('num', num_pipeline, all_numerical),
        ('cat', cat_pipeline, CATEGORICAL_FEATURES),
        ('pass', 'passthrough', passthrough_features)
    ])
    
    full_pipeline = Pipeline([
        ('feature_adder', ClinicalFeatureAdder()),
        ('col_transformer', col_transformer)
    ])
    
    return full_pipeline

def get_feature_names(col_transformer: ColumnTransformer) -> List[str]:
    """Helper to extract feature names from fitted ColumnTransformer."""
    feature_names = []
    
    for name, trans, cols in col_transformer.transformers_:
        if name == 'num':
            feature_names.extend([f"num__{c}" for c in cols])
        elif name == 'cat':
            ohe = trans.named_steps['ohe']
            ohe_cols = ohe.get_feature_names_out(cols).tolist()
            feature_names.extend([f"cat__{c}" for c in ohe_cols])
        elif name == 'pass':
            feature_names.extend([f"pass__{c}" for c in cols])
            
    return feature_names
