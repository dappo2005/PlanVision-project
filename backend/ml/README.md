# backend/ml - Machine Learning Training & Evaluation

This folder contains all ML training, evaluation, and dataset preparation scripts for the PlanVision citrus leaf disease classifier.

## Contents

### Training Scripts
- `train.py`: Main training script using EfficientNetB0 transfer learning
- `train_augmented.py`: Training with heavy data augmentation for class imbalance
- `evaluate.py`: Plot training history and evaluation metrics

### Dataset Utilities
- `create_split.py`: Split raw dataset into train/val/test (70/15/15)
- `dataset_check.py`: Verify dataset structure and class counts

### Configuration & Helpers
- `requirements-ml.txt`: Full ML dependencies (TensorFlow, scikit-learn, opencv, etc.)
- `RUN_TRAINING.bat`: Windows batch wrapper to run training with conda
- `run_training.ps1`: PowerShell wrapper for training
- `monitor_training.ps1`: Live training progress monitor

## Usage Examples

### Train a model
From project root:
```powershell
python backend/ml/train.py --epochs 20 --batch_size 32
```

Or from `backend/ml/`:
```powershell
python train.py --epochs 20 --batch_size 32
```

Default paths (`../../data/plantvision_dataset` and `../../models/efficientnet_saved`) are preconfigured.

### Create dataset split
```powershell
python backend/ml/create_split.py
```
Reads from `../../Citrus Leaf Disease Image/`, writes to `../../data/plantvision_dataset/`.

### Evaluate training history
```powershell
python backend/ml/evaluate.py
```
Reads `../../models/efficientnet_saved/history.json`, generates plots.

## Notes
- These scripts are **not** required in production (only `backend/app.py` loads the trained model).
- Install ML deps with: `pip install -r backend/ml/requirements-ml.txt`
- Keep large datasets and models out of Git (already in `.gitignore`).
