"""
Configuration module for Blood Pressure Estimation & Hypertension Screening AI Module.
Defines file paths, signal sampling frequencies, filter cutoffs, sliding window parameters,
AHA/ACC clinical blood pressure classification thresholds, and risk scoring weights.
"""

from pathlib import Path

# Base Directory Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR.parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"
OUTPUT_DIR = BASE_DIR / "outputs"
FIGURES_DIR = OUTPUT_DIR / "figures"
REPORTS_DIR = OUTPUT_DIR / "reports"

# Ensure required directories exist
for path in [DATA_DIR, MODEL_DIR, OUTPUT_DIR, FIGURES_DIR, REPORTS_DIR]:
    path.mkdir(parents=True, exist_ok=True)

# Artifact Export Paths
PREPROCESSOR_PATH = MODEL_DIR / "preprocessor.joblib"
BEST_SBP_MODEL_PATH = MODEL_DIR / "sbp_model.joblib"
BEST_DBP_MODEL_PATH = MODEL_DIR / "dbp_model.joblib"
MODEL_METADATA_PATH = MODEL_DIR / "model_metadata.joblib"
CALIBRATION_CONFIG_PATH = MODEL_DIR / "calibration_config.json"

# Signal Processing Hyperparameters
SAMPLING_RATE = 125.0  # Hz (UCI Cuff-Less Dataset sampling frequency)
WINDOW_DURATION_SEC = 10.0  # seconds
WINDOW_SIZE = int(SAMPLING_RATE * WINDOW_DURATION_SEC)  # 1250 samples per window
WINDOW_STEP = int(WINDOW_SIZE // 2)  # 50% overlap (625 samples)

# Butterworth Bandpass Filter Settings
PPG_LOWCUT = 0.5   # Hz (removes DC & baseline wander < 0.5 Hz / 30 bpm)
PPG_HIGHCUT = 8.0  # Hz (retains main pulse waveform & dicrotic notch, suppresses high-freq noise)

ECG_LOWCUT = 0.5   # Hz
ECG_HIGHCUT = 40.0 # Hz (standard ECG clinical bandpass)

# Signal Quality & Physiological Verification Thresholds
MIN_SBP_PHYSIOLOGICAL = 50.0   # mmHg
MAX_SBP_PHYSIOLOGICAL = 220.0  # mmHg
MIN_DBP_PHYSIOLOGICAL = 35.0   # mmHg
MAX_DBP_PHYSIOLOGICAL = 140.0  # mmHg
MIN_PULSE_PRESSURE = 15.0      # SBP - DBP >= 15 mmHg

# Seed & Split Parameters
RANDOM_SEED = 42
TEST_SIZE = 0.20

# AHA/ACC Clinical Blood Pressure Categories (mmHg)
# Normal: SBP < 120 and DBP < 80
# Elevated: 120 <= SBP < 130 and DBP < 80
# Stage 1 Hypertension: 130 <= SBP < 140 or 80 <= DBP < 90
# Stage 2 Hypertension: 140 <= SBP < 180 or 90 <= DBP < 120
# Hypertensive Crisis: SBP >= 180 or DBP >= 120
BP_CATEGORIES = {
    "NORMAL": "Normal",
    "ELEVATED": "Elevated",
    "STAGE_1": "Stage 1 Hypertension",
    "STAGE_2": "Stage 2 Hypertension",
    "CRISIS": "Hypertensive Crisis"
}

# Clinical Screening Recommendation Rules
RECOMMENDATION_RULES = {
    "NORMAL": [
        "Maintain routine annual blood pressure checkups.",
        "Follow a balanced diet and regular physical activity."
    ],
    "ELEVATED": [
        "Recommend lifestyle modifications (lowering sodium intake, exercise).",
        "Re-evaluate blood pressure within 3 to 6 months."
    ],
    "STAGE_1": [
        "Recommend clinical blood pressure confirmation with a calibrated cuff.",
        "Lifestyle modification counseling.",
        "Consult primary care for hypertension risk assessment."
    ],
    "STAGE_2": [
        "Recommend clinical blood pressure confirmation.",
        "Prompt medical evaluation and lifestyle modification.",
        "Cardiology consultation if clinically indicated."
    ],
    "CRISIS": [
        "URGENT: Immediate clinical confirmation of blood pressure required.",
        "Immediate medical evaluation for hypertensive emergency."
    ]
}
