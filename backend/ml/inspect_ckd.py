import joblib
import os
base_dir = os.path.dirname(__file__)
meta = joblib.load(os.path.join(base_dir, "ckd", "ckd_model_metadata.joblib"))
print("CKD NUMERICAL:", meta.get('numerical_features'))
print("CKD CATEGORICAL:", meta.get('categorical_features'))
