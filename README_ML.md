# PlanVision ML Training & Inference Guide

## Instalasi Environment

### Opsi 1: Gunakan Conda (Recommended)

```bash
# Buat environment baru dengan Python 3.9
conda create -n planvision-ml python=3.9 -y

# Activate environment
conda activate planvision-ml

# Install ML packages
pip install -r backend/requirements-ml.txt
```

### Opsi 2: Quick Setup (Windows Batch)

Di folder `backend/`, jalankan:
```cmd
RUN_TRAINING.bat
```

Script akan otomatis mengactivate env dan menjalankan training.

---

## Training Model

### Command Line

```bash
cd backend
python train.py \
    --data_dir "../data/plantvision_dataset" \
    --model_dir "../models/efficientnet_saved" \
    --img_size 224 \
    --batch_size 32 \
    --epochs 20
```

### Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--data_dir` | `../data/plantvision_dataset` | Path ke dataset (harus ada train/val/test) |
| `--model_dir` | `../models/efficientnet_saved` | Output folder untuk SavedModel |
| `--img_size` | 224 | Input image size (height=width) |
| `--batch_size` | 32 | Batch size (kurangi jika OOM) |
| `--epochs` | 20 | Jumlah epoch training |
| `--learning_rate` | 0.001 | Learning rate untuk Adam optimizer |
| `--fine_tune_at` | None | Jika set, unfreeze layers dari index ini |
| `--seed` | 42 | Random seed |

### Quick Test (3 epoch, batch=8, CPU-friendly)

```bash
python train.py --epochs 3 --batch_size 8
```

Expected output:
```
Building datasets from:
  train: ../data/plantvision_dataset/train
  val:   ../data/plantvision_dataset/val
  test:  ../data/plantvision_dataset/test

Detected classes: ['Black spot', 'Canker', 'Greening', 'Healthy', 'Melanose']

Training head (base model frozen)
Epoch 1/1
...
Epoch 3/1 - 2m 15s loss: 0.8234 - accuracy: 0.7123 - val_loss: 0.6234 - val_accuracy: 0.7890
...
Saving SavedModel to ../models/efficientnet_saved/saved_model
Training complete. Model and history saved to ../models/efficientnet_saved
```

### Output Files

Setelah training, folder `models/efficientnet_saved/` akan berisi:

```
efficientnet_saved/
├── saved_model/              # TensorFlow SavedModel format
│   ├── assets/
│   ├── variables/
│   └── saved_model.pb
├── best_model.h5             # Checkpoint terbaik
└── history.json              # Training history (loss, accuracy, etc)
```

---

## Inference (Flask API)

### Setup

Backend Flask akan auto-load SavedModel pada startup. Endpoint:

```
POST /api/predict
Content-Type: multipart/form-data

image: <binary image file>
```

### Response

```json
{
  "predictions": [
    {
      "class": "Healthy",
      "probability": 0.95
    },
    {
      "class": "Black spot",
      "probability": 0.04
    },
    {
      "class": "Canker",
      "probability": 0.01
    }
  ],
  "top_class": "Healthy",
  "inference_time_ms": 234.5
}
```

### Example cURL

```bash
curl -X POST -F "image=@photo.jpg" http://localhost:5000/api/predict
```

### Example Python

```python
import requests

with open('test_image.jpg', 'rb') as f:
    files = {'image': f}
    response = requests.post('http://localhost:5000/api/predict', files=files)
    print(response.json())
```

---

## Frontend Integration

### React Component Example

```jsx
import { useState } from 'react';

export function DiseaseDetector() {
  const [image, setImage] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPredictions(null);
    }
  };

  const handlePredict = async () => {
    if (!image) {
      setError('Silakan pilih gambar terlebih dahulu');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', image);

    try {
      const response = await fetch('http://localhost:5000/api/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      setPredictions(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="disease-detector">
      <h2>Disease Detection</h2>

      <div className="upload-section">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={loading}
        />
        {image && <p>Selected: {image.name}</p>}
      </div>

      <button onClick={handlePredict} disabled={loading || !image}>
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>

      {error && <div className="error">{error}</div>}

      {predictions && (
        <div className="results">
          <h3>Results:</h3>
          <div className="top-result">
            <p>
              <strong>Diagnosis:</strong> {predictions.top_class}
            </p>
            <p>
              <strong>Confidence:</strong>{' '}
              {(predictions.predictions[0].probability * 100).toFixed(2)}%
            </p>
          </div>

          <details>
            <summary>All Predictions</summary>
            {predictions.predictions.map((pred, idx) => (
              <div key={idx} className="prediction-item">
                <span>{pred.class}:</span>
                <span>
                  {(pred.probability * 100).toFixed(2)}%
                </span>
              </div>
            ))}
          </details>

          <p>
            <small>
              Inference time: {predictions.inference_time_ms.toFixed(2)}ms
            </small>
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## Dataset Structure

```
data/plantvision_dataset/
├── train/
│   ├── Black spot/
│   ├── Canker/
│   ├── Greening/
│   ├── Healthy/
│   └── Melanose/
├── val/
│   ├── Black spot/
│   ├── Canker/
│   ├── Greening/
│   ├── Healthy/
│   └── Melanose/
└── test/
    ├── Black spot/
    ├── Canker/
    ├── Greening/
    ├── Healthy/
    └── Melanose/
```

**Dataset Stats** (after stratified split):
- Train: 423 images
- Val: 88 images
- Test: 96 images
- **Total: 607 images (5 classes)**

---

## Troubleshooting

### TensorFlow Import Error

```
ModuleNotFoundError: No module named 'tensorflow'
```

**Fix:**
```bash
pip install tensorflow==2.15.0
```

### OOM (Out of Memory)

Jika laptop tidak cukup RAM, kurangi `batch_size`:

```bash
python train.py --batch_size 4 --epochs 5
```

### Dataset Not Found

Pastikan struktur dataset benar:

```bash
python -c "from backend.dataset_check import *"
python backend/dataset_check.py
```

### Model Not Loading

Pastikan SavedModel folder ada dan tidak rusak:

```bash
ls models/efficientnet_saved/saved_model/
```

---

## Next Steps

1. ✅ Run training: `python train.py --epochs 20`
2. ✅ Start Flask: `python app.py`
3. ✅ Test API: `curl -F "image=@test.jpg" http://localhost:5000/api/predict`
4. ✅ Integrate frontend: use DiseaseDetector component
5. ⭐ Monitor: check inference latency and accuracy on real photos

