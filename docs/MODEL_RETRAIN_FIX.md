# Model Accuracy Issue - Root Cause & Solution

## Problem Identified (2025-11-20)

**Symptoms:**
- Website detection: Black spot images predicted as Greening (HLB)
- All classes misclassified
- Overall accuracy: **20%** (should be 85%+)

## Root Cause Analysis

### Test Results:
```
OVERALL ACCURACY: 10/50 correct = 20.0%

Per-Class Breakdown:
- Black spot:  0% accuracy (0/10 correct)
- Canker:      0% accuracy (0/10 correct)  
- Greening:  100% accuracy (10/10 correct)
- Healthy:     0% accuracy (0/10 correct)
- Melanose:    0% accuracy (0/10 correct)
```

**All predictions → Greening with ~24.8% confidence** (random guess level)

### Diagnosis:
✅ Class order verified - CORRECT  
✅ Code implementation - CORRECT  
❌ **Model weights - BROKEN** (not properly trained)

**Conclusion:** Current model (`models/efficientnet_saved/`) is essentially untrained or corrupted. It defaulting to one class with near-random confidence indicates the neural network weights are not properly learned.

## Solution Implemented

### 1. Retrain Model with Augmentation
```powershell
cd backend\ml
C:\ProgramData\anaconda3\Scripts\conda.exe run -n planvision-ml python train_augmented.py --epochs 30 --batch_size 16 --learning_rate 0.001
```

**Training Configuration:**
- **Architecture:** EfficientNetB0 (Transfer Learning)
- **Input size:** 224x224x3
- **Data augmentation:** 
  - Random horizontal/vertical flip
  - Random rotation (±30°)
  - Random zoom (±20%)
- **Epochs:** 30
- **Batch size:** 16
- **Learning rate:** 0.001
- **Optimizer:** Adam
- **Loss:** Sparse Categorical Crossentropy

**Expected Training Time:** ~20-40 minutes

### 2. Monitoring Training Progress

Check training logs:
```powershell
cd backend\ml
Get-Content -Wait training.log  # if logging to file
```

Or monitor with Python script:
```powershell
python monitor_training.ps1
```

### 3. Post-Training Validation

After training completes, run validation tests:

```powershell
cd backend\scripts

# Test batch inference
python test_batch_inference.py

# Expected output:
# Overall accuracy: >85%
# Per-class accuracy: >80% for each class
```

## Success Criteria

✅ **Overall Accuracy:** >85%  
✅ **Per-Class Accuracy:** Each class >80%  
✅ **No bias:** No single class dominating predictions  
✅ **Confidence:** Top predictions >60% confidence  

## Prevention

**Before deploying any model:**
1. ✅ Run `test_batch_inference.py` 
2. ✅ Check confusion matrix
3. ✅ Verify accuracy >85%
4. ✅ Test with real images from each class

## Files Updated/Created

1. `backend/scripts/test_batch_inference.py` - Batch testing tool
2. `backend/scripts/verify_class_order.py` - Class order validator
3. `backend/ml/train_augmented.py` - Enhanced training script
4. `docs/MODEL_RETRAIN_FIX.md` - This documentation

## Next Steps

1. **Wait for training to complete** (~30 min)
2. **Run validation:** `python test_batch_inference.py`
3. **If accuracy >85%:** Deploy to production
4. **If accuracy <85%:** 
   - Check dataset balance
   - Increase epochs to 50
   - Try different learning rates (0.0005 or 0.0001)

## Technical Notes

### Why Transfer Learning?
- EfficientNetB0 pre-trained on ImageNet
- Better than CNN from scratch for small datasets
- Faster convergence
- Higher accuracy (~90% vs ~70%)

### Why Data Augmentation?
- Increases training data diversity
- Prevents overfitting
- Improves generalization
- Handles class imbalance

### Model Architecture:
```
Input (224x224x3)
    ↓
EfficientNetB0 Base (frozen)
    ↓
GlobalAveragePooling2D
    ↓
Dropout(0.3)
    ↓
Dense(128, relu)
    ↓
Dropout(0.3)
    ↓
Dense(5, softmax) → [Black spot, Canker, Greening, Healthy, Melanose]
```

---

**Status:** 🔄 Training in progress...  
**Updated:** 2025-11-20 16:10  
**By:** GitHub Copilot (automated diagnosis & fix)
