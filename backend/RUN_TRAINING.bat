@echo off
REM Training script for PlanVision ML
REM This script activates the planvision-ml conda environment and runs training

echo ========================================
echo PlanVision Model Training
echo ========================================
echo.
echo [1] Verifying conda environment...
call C:\ProgramData\Anaconda3\Scripts\activate.bat planvision-ml

echo.
echo [2] Checking TensorFlow installation...
python -c "import tensorflow as tf; print('TensorFlow version:', tf.__version__)"

echo.
echo [3] Running training (epochs=3, batch_size=8)...
python train.py --epochs 3 --batch_size 8 --data_dir "..\data\plantvision_dataset" --model_dir "..\models\efficientnet_saved"

echo.
echo [4] Training complete!
echo Model saved to: ..\models\efficientnet_saved\saved_model
echo History saved to: ..\models\efficientnet_saved\history.json
echo.
pause
