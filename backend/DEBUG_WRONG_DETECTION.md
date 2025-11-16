# 🔍 DEBUGGING: Model Salah Deteksi

## ❓ Masalah:
Upload foto **Black spot** tapi terdeteksi sebagai **Greening (HLB)**

---

## 🧪 KEMUNGKINAN PENYEBAB & SOLUSI:

### **1. Model Belum Cukup Akurat (Most Likely)**

**Cek training history:**
- Final validation accuracy: **~88%** 
- Ini artinya model **masih salah ~12% dari waktu**
- 10 epochs mungkin **tidak cukup** untuk konvergen

**✅ SOLUSI: Re-train dengan lebih banyak epochs**

```powershell
cd backend
python train.py --epochs 50 --batch_size 16 --learning_rate 0.0001
```

Perubahan:
- `--epochs 50` → Lebih banyak waktu belajar
- `--batch_size 16` → Lebih stabil (kurangi jika OOM)
- `--learning_rate 0.0001` → Learning rate lebih kecil untuk fine detail

**Expected result:** Validation accuracy > 95%

---

### **2. Fine-tuning Base Model (Advanced)**

Model sekarang hanya train **classification head**, base EfficientNet masih frozen.

**✅ SOLUSI: Unfreeze beberapa layers**

```powershell
cd backend
python train.py --epochs 30 --fine_tune_at 100 --learning_rate 0.00001
```

`--fine_tune_at 100` → Unfreeze layers dari index 100 ke atas

**Warning:** Butuh lebih lama, tapi hasil lebih akurat!

---

### **3. Class Imbalance (Cek Dataset)**

Mungkin dataset tidak seimbang (satu class punya lebih banyak gambar).

**✅ CEK:**

```powershell
cd backend
python -c "import os; train_dir='../data/plantvision_dataset/train'; classes=sorted(os.listdir(train_dir)); [print(f'{c}: {len(os.listdir(os.path.join(train_dir, c)))} images') for c in classes if os.path.isdir(os.path.join(train_dir, c))]"
```

**Expected:** Semua class punya jumlah gambar yang mirip (~100-150 per class)

**Jika tidak seimbang:**
- Tambah data augmentation
- Atau tambah foto untuk class yang kurang

---

### **4. Preprocessing Issue**

Mungkin preprocessing di app.py berbeda dengan saat training.

**✅ CEK app.py (line ~290):**

```python
img = img.resize((224, 224))  # ✅ Correct
img_array = np.array(img) / 255.0  # ✅ Correct (normalize 0-1)
```

Ini sudah benar! ✅

---

### **5. Test Model Secara Manual**

**Test dengan berbagai foto:**

```powershell
cd backend

# Test Black spot
python test_inference.py "../Citrus Leaf Disease Image/Black spot/1.jpg"

# Test Canker
python test_inference.py "../Citrus Leaf Disease Image/Canker/1.jpg"

# Test Greening
python test_inference.py "../Citrus Leaf Disease Image/Greening/1.jpg"

# Test Healthy
python test_inference.py "../Citrus Leaf Disease Image/Healthy/1.jpg"
```

**Lihat output:** Apakah prediksi benar untuk semua?

Jika banyak yang salah → **Model memang belum akurat, perlu re-train**

---

## 🎯 REKOMENDASI SAYA:

### **Quick Fix (Paling Mudah):**

**1. Re-train dengan epochs lebih banyak:**

```powershell
cd "d:\daffa\SMT 5\RPL\PlanVision-project\backend"

# Backup model lama
Rename-Item "../models/efficientnet_saved" "../models/efficientnet_saved_OLD"

# Train ulang dengan config lebih baik
python train.py --epochs 50 --batch_size 16 --learning_rate 0.0001
```

**Estimasi waktu:** 20-40 menit (tergantung CPU/GPU)

**Expected result:** Model baru dengan accuracy > 95%

---

### **Advanced Fix (Jika punya waktu):**

**2. Fine-tune base model:**

```powershell
# Stage 1: Train head (10 epochs)
python train.py --epochs 10 --batch_size 32

# Stage 2: Fine-tune top layers (20 epochs)
python train.py --epochs 20 --fine_tune_at 100 --learning_rate 0.00001
```

---

## 📊 MONITORING TRAINING:

Saat training, perhatikan:
- **Loss harus turun** terus menerus
- **Val_accuracy harus naik** dan stabil di >95%
- **Gap antara train & val accuracy** tidak terlalu besar (<5%)

**Good training example:**
```
Epoch 50/50
loss: 0.05 - accuracy: 0.98 - val_loss: 0.12 - val_accuracy: 0.96
```

**Bad training (overfitting):**
```
Epoch 50/50
loss: 0.01 - accuracy: 0.99 - val_loss: 0.45 - val_accuracy: 0.85
```
→ Train accuracy tinggi, tapi val accuracy rendah

---

## ✅ SETELAH RE-TRAIN:

1. **Restart backend:** `python app.py`
2. **Test upload lagi** dengan berbagai foto
3. **Verifikasi accuracy** meningkat
4. **Check consistency:** Upload foto yang sama 3x, hasil harus konsisten

---

## 🔧 TEMPORARY WORKAROUND (Jika tidak bisa re-train sekarang):

Tambahkan **confidence threshold** di frontend:

```typescript
// Di DiseaseDetector.tsx
if (data.top_probability < 0.80) {
  toast.warning("Confidence rendah", {
    description: "Model tidak yakin dengan hasil deteksi. Coba foto lain dengan lighting lebih baik."
  });
}
```

Ini akan warn user jika model tidak yakin (confidence < 80%).

---

**Rekomendasi:** **Re-train dengan 50 epochs** untuk hasil terbaik! 🚀
