# PowerShell script to run training using the planvision-ml conda environment (moved to backend/ml)
# Usage: powershell -ExecutionPolicy Bypass -File run_training.ps1

Write-Output "=== PlanVision ML Training Runner ==="
Write-Output ""
Write-Output "[1] Verifying conda environment..."
& "C:\Users\HYPE-R\.conda\envs\planvision-ml\Scripts\python.exe" --version

Write-Output ""
Write-Output "[2] Checking TensorFlow installation..."
& "C:\Users\HYPE-R\.conda\envs\planvision-ml\Scripts\python.exe" -c "import tensorflow as tf; print('TensorFlow version:', tf.__version__)"

Write-Output ""
Write-Output "[3] Running training script (epochs=3, batch_size=8 for quick test)..."
$env:PYTHONPATH = "$PSScriptRoot/.."
& "C:\Users\HYPE-R\.conda\envs\planvision-ml\Scripts\python.exe" "$PSScriptRoot/train.py" --epochs 3 --batch_size 8 --data_dir "..\..\data\plantvision_dataset" --model_dir "..\..\models\efficientnet_saved"

Write-Output ""
Write-Output "[4] Training complete!"
Write-Output "Check ..\..\models\efficientnet_saved for SavedModel and history.json"
