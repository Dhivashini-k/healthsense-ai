import pandas as pd
import numpy as np
import joblib
import os
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, average_precision_score, confusion_matrix, classification_report
import warnings
warnings.filterwarnings('ignore')

def train_and_evaluate():
    data_path = "CKD_Risk_Progression_Dataset_2026.csv"
    if not os.path.exists(data_path):
        # Fallback to local path if run from backend folder
        data_path = os.path.join(os.path.dirname(__file__), "CKD_Risk_Progression_Dataset_2026.csv")

    df = pd.read_csv(data_path)
    
    # 1. Feature Selection
    exclude_features = [
        'Patient_ID', 'Serum_Creatinine', 'Blood_Urea_Nitrogen', 'Albumin', 'Urine_ACR', 
        'Albuminuria_Category', 'Urine_Protein', 'HbA1c', 'Fasting_Glucose', 'Hemoglobin', 
        'Sodium', 'Potassium', 'Calcium', 'Phosphorus', 'Uric_Acid', 'Total_Cholesterol', 
        'HDL', 'LDL', 'Triglycerides', 'CRP', 'eGFR', 'CKD_Stage', 'Kidney_Failure_Risk', 
        'Dialysis_Required', 'Hospitalization_Risk', 'Daily_Steps', 'Sodium_Intake_mg', 
        'Body_Fat_Percentage', 'Heart_Rate', 'Respiratory_Rate', 'Oxygen_Saturation', 
        'Frailty_Index', 'Frailty_Category', 'Annual_Medical_Cost_USD'
    ]
    
    # Drop features if they exist
    df = df.drop(columns=[col for col in exclude_features if col in df.columns], errors='ignore')
    
    target = 'CKD'
    X = df.drop(columns=[target])
    y = df[target]

    # Identify column types
    categorical_features = X.select_dtypes(include=['object', 'category']).columns.tolist()
    numerical_features = X.select_dtypes(include=['number']).columns.tolist()

    # Define Preprocessing Steps
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numerical_features),
            ('cat', categorical_transformer, categorical_features)
        ])

    # Splitting Data (70% Train, 15% Val, 15% Test)
    X_train_val, X_test, y_train_val, y_test = train_test_split(X, y, test_size=0.15, stratify=y, random_state=42)
    X_train, X_val, y_train, y_val = train_test_split(X_train_val, y_train_val, test_size=0.1765, stratify=y_train_val, random_state=42) # 0.1765 * 0.85 = ~0.15

    print(f"Train shape: {X_train.shape}, Val shape: {X_val.shape}, Test shape: {X_test.shape}")
    print(f"Class distribution - Train: {y_train.value_counts().to_dict()}, Test: {y_test.value_counts().to_dict()}")

    # Define Models
    models = {
        'Logistic Regression': LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42, n_jobs=-1),
        'XGBoost': XGBClassifier(use_label_encoder=False, eval_metric='logloss', scale_pos_weight=(y_train.value_counts()[0] / y_train.value_counts()[1]) if y_train.value_counts()[1] > 0 else 1, random_state=42, n_jobs=-1)
    }

    best_model_name = None
    best_recall = -1
    best_pipeline = None

    results = []

    # Train and Evaluate
    for name, model in models.items():
        print(f"Training {name}...")
        pipeline = ImbPipeline(steps=[
            ('preprocessor', preprocessor),
            # SMOTE not needed if class_weight/scale_pos_weight is used, but we could add if needed
            ('classifier', model)
        ])
        
        pipeline.fit(X_train, y_train)
        
        # Predict on validation to find best threshold
        y_val_probs = pipeline.predict_proba(X_val)[:, 1]
        
        # We want high recall, so let's check threshold 0.3, 0.4, 0.5
        thresholds = [0.3, 0.4, 0.5]
        best_thresh = 0.5
        best_val_recall = -1
        
        for t in thresholds:
            y_val_pred = (y_val_probs >= t).astype(int)
            r = recall_score(y_val, y_val_pred, zero_division=0)
            if r > best_val_recall:
                best_val_recall = r
                best_thresh = t
                
        # Evaluate on test set with best threshold
        y_test_probs = pipeline.predict_proba(X_test)[:, 1]
        y_test_pred = (y_test_probs >= best_thresh).astype(int)
        
        acc = accuracy_score(y_test, y_test_pred)
        prec = precision_score(y_test, y_test_pred, zero_division=0)
        rec = recall_score(y_test, y_test_pred, zero_division=0)
        f1 = f1_score(y_test, y_test_pred, zero_division=0)
        roc = roc_auc_score(y_test, y_test_probs)
        prc = average_precision_score(y_test, y_test_probs)
        
        results.append({
            'Model': name,
            'Threshold': best_thresh,
            'Accuracy': acc,
            'Precision': prec,
            'Recall': rec,
            'F1': f1,
            'ROC-AUC': roc,
            'PR-AUC': prc
        })
        
        print(f"{name} Results on Test Set (Thresh: {best_thresh}):")
        print(classification_report(y_test, y_test_pred))
        
        if rec > best_recall:
            best_recall = rec
            best_model_name = name
            best_pipeline = pipeline

    print("\n--- Final Results Summary ---")
    results_df = pd.DataFrame(results)
    print(results_df.to_string())
    
    print(f"\nBest Model by Recall: {best_model_name}")

    # Feature Importance for the best model if it's tree-based
    if best_model_name in ['Random Forest', 'XGBoost']:
        print("Extracting feature importances...")
        classifier = best_pipeline.named_steps['classifier']
        
        # Get feature names after preprocessing
        try:
            cat_encoder = best_pipeline.named_steps['preprocessor'].transformers_[1][1].named_steps['onehot']
            cat_features_encoded = cat_encoder.get_feature_names_out(categorical_features)
            all_features = numerical_features + list(cat_features_encoded)
            
            importances = classifier.feature_importances_
            feat_imp = pd.DataFrame({'Feature': all_features, 'Importance': importances})
            feat_imp = feat_imp.sort_values(by='Importance', ascending=False).head(20)
            print("\nTop 20 Features:")
            print(feat_imp.to_string())
            
            # Save feature list
            joblib.dump(all_features, os.path.join(os.path.dirname(__file__), "feature_names.joblib"))
        except Exception as e:
            print("Could not extract feature importances:", e)

    # Save Best Model
    model_path = os.path.join(os.path.dirname(__file__), "ckd_risk_model.joblib")
    joblib.dump(best_pipeline, model_path)
    
    # Save the selected features
    meta_data = {
        'numerical_features': numerical_features,
        'categorical_features': categorical_features,
        'best_threshold': results_df.loc[results_df['Model'] == best_model_name, 'Threshold'].values[0]
    }
    joblib.dump(meta_data, os.path.join(os.path.dirname(__file__), "ckd_model_metadata.joblib"))
    print(f"Saved best model to {model_path}")

if __name__ == "__main__":
    train_and_evaluate()
