import joblib
import os
import json

base_dir = os.path.dirname(__file__)

def inspect_metadata(path):
    print(f"Inspecting {path}")
    if not os.path.exists(path):
        print("Not found")
        return
    try:
        data = joblib.load(path)
        print(data)
    except Exception as e:
        print(f"Error: {e}")

inspect_metadata(os.path.join(base_dir, "hypertension", "model_metadata.joblib"))
inspect_metadata(os.path.join(base_dir, "ckd", "ckd_model_metadata.joblib"))
