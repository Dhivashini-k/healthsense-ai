# Health Sense AI — Retinal Image Analysis for Diabetes Risk Estimation

[![Python 3.13](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)
[![PyTorch 2.13](https://img.shields.io/badge/PyTorch-2.13-ee4c2c.svg)](https://pytorch.org/)
[![TIMM](https://img.shields.io/badge/TIMM-1.0.28-green.svg)](https://github.com/huggingface/pytorch-image-models)
[![Status](https://img.shields.io/badge/Status-Production--Ready-brightgreen.svg)]()

Production-ready deep learning module for **Retinal Image Analysis & AI-Assisted Diabetes Risk Estimation**, designed for integration into the **Health Sense AI** clinical decision support platform.

---

## 📌 Clinical Overview & Objective

Diabetic Retinopathy (DR) is a primary micro-vascular complication of diabetes mellitus. Early screening using digital fundus photography allows clinicians to detect micro-vascular lesions (microaneurysms, hemorrhages, hard exudates, neovascularization) and estimate patient diabetes risk before severe vision loss occurs.

- **Primary Goal**: Analyze retinal fundus photographs to predict DR severity stage (0–4) and estimate continuous **Diabetes Risk ($0\% - 100\%$)**.
- **Clinical Role**: Doctor-facing AI screening assistant. **Not a standalone diagnostic system**.
- **Optimization Objective**: Maximize Quadratic Weighted Kappa (QWK) and Disease Screening Recall while generating interpretable Grad-CAM heatmaps and laboratory testing recommendations.

---

## 📂 Project Structure

```text
diabetes_model/
├── data/                                      # Data split manifests & dataset references
├── src/
│   ├── config.py                              # Hyperparameters, paths, backbones, DR mappings
│   ├── utils.py                               # Logger, random seed, risk mapping & recommendation logic
│   ├── preprocessing.py                        # Border removal, centering, CLAHE, 512x512 resizing
│   ├── augmentations.py                        # Medically safe Albumentations transformations
│   ├── dataset.py                              # PyTorch APTOS dataset loader with corruption filter
│   ├── train.py                                # Training, imbalance comparison & backbone selection
│   ├── evaluate.py                             # QWK, Macro F1, Per-class Recall/Precision, ROC-AUC
│   ├── calibration.py                          # Temperature scaling probability calibrator
│   ├── gradcam.py                              # Grad-CAM heatmap visualization generator
│   ├── predictor.py                            # Standardized public API: load_model() & predict(path)
│   ├── fast_train.py                           # High-efficiency CPU retrain pipeline
│   └── save_model_artifacts.py                 # Initial model artifact serializer
├── models/                                     # Exported PyTorch state dicts & configs
│   ├── best_model.pth
│   ├── preprocess_config.json
│   ├── class_mapping.json
│   └── calibration_config.json
├── outputs/                                    # Generated Grad-CAM heatmaps & evaluation reports
│   └── heatmap.png
├── tests/                                      # Automated Pytest unit test suite
│   ├── test_preprocessing.py
│   ├── test_calibration.py
│   ├── test_evaluate.py
│   └── test_predictor.py
├── conftest.py                                 # Pytest path resolution helper
├── requirements.txt                            # Module dependencies
└── README.md
```

---

## 📊 Dataset & DR Stage Target

Source: [APTOS 2019 Blindness Detection Dataset](https://www.kaggle.com/competitions/aptos2019-blindness-detection)

- **Total Samples**: 3,662 high-resolution retinal fundus photographs.
- **Target (`diagnosis`) Classes**:
  - `0` — No Diabetic Retinopathy
  - `1` — Mild Non-Proliferative DR (Mild NPDR)
  - `2` — Moderate Non-Proliferative DR (Moderate NPDR)
  - `3` — Severe Non-Proliferative DR (Severe NPDR)
  - `4` — Proliferative DR (Proliferative DR)

---

## 🔬 Image Preprocessing & Augmentations

### Preprocessing (`src/preprocessing.py`)
1. **Automatic Black Border Removal**: Intensity thresholding removes uninformative black margin borders.
2. **Retina Centering & Padding**: Symmetric padding converts rectangular images into square aspect ratio without stretching.
3. **CLAHE Feature Enhancement**: Contrast Limited Adaptive Histogram Equalization applied to L-channel in LAB space highlights micro-aneurysms and fine vessel structures.
4. **Resolution Normalization**: Resized to $512 \times 512$ with antialiasing.
5. **Corruption Check**: Corrupted or unreadable image files are automatically detected and filtered out.

### Augmentations (`src/augmentations.py`)
- Medically safe Albumentations transformations avoiding non-physiological distortions:
  - `HorizontalFlip(p=0.5)`
  - `ShiftScaleRotate(rotate_limit=15, scale_limit=0.05, shift_limit=0.05, p=0.5)`
  - `RandomBrightnessContrast(brightness_limit=0.1, contrast_limit=0.1, p=0.5)`
  - ImageNet normalization ($mean=[0.485, 0.456, 0.406]$, $std=[0.229, 0.224, 0.225]$).

---

## 🎯 Model Architecture, Calibration & Explainability

### Model Backbones (`src/train.py`)
- Supports fine-tuning pretrained vision backbones via `timm`:
  - `efficientnet_b0` (Default top performer)
  - `efficientnet_b3`
  - `efficientnet_b4`
  - `densenet121`
  - `convnext_tiny`

### Imbalance Mitigation Strategies
- Evaluates **Weighted Cross-Entropy Loss**, **Focal Loss ($\gamma=2.0$)**, and **Weighted Random Sampler**.

### Temperature Scaling Calibration (`src/calibration.py`)
- Fits scalar parameter $T > 0$ on validation logits via NLL loss minimization so softmax outputs $\sigma(\mathbf{z}/T)$ yield calibrated confidence scores.

### Grad-CAM Explainability (`src/gradcam.py`)
- Extracts class activation maps from the final 2D convolutional layer and generates a 3-panel visualization (Original Retina | Heatmap | Overlay) saved to `outputs/heatmap.png`.

---

## 🚀 Public Predictor API (`src/predictor.py`)

The module exposes **ONLY** `load_model()` and `predict(image_path)`:

### Integration Example:

```python
from src.predictor import load_model, predict

# 1. Initialize model artifacts into memory once at startup
load_model()

# 2. Input image path
image_path = "d:/Projects/ncd-early-screening/APTOS/train_images/000c1434d8d7.png"

# 3. Get prediction output
result = predict(image_path)
```

### Returned Output Schema:

```json
{
    "disease": "Diabetes",
    "probability": 86.6,
    "risk_category": "High",
    "dr_stage": "Severe NPDR",
    "confidence": 48.7,
    "explanation": {
        "gradcam": "outputs/heatmap.png"
    },
    "clinical_interpretation": "Severe diabetic retinal changes observed (significant intraretinal hemorrhages or cotton wool spots), indicating high risk of uncontrolled diabetic complications.",
    "recommendations": [
        "Recommend HbA1c testing",
        "Recommend fasting blood glucose",
        "Recommend ophthalmology consultation",
        "Urgent comprehensive dilated eye examination",
        "Strict glycemic and blood pressure management review"
    ]
}
```

---

## 🧪 Installation & Running Tests

### 1. Requirements Installation
```bash
python -m pip install -r requirements.txt
```

### 2. Run Automated Pytest Unit Test Suite
```bash
python -m pytest tests/
```

### 3. Retrain & Benchmark Models
```bash
python -m src.train
```
