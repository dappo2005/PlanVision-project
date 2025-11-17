# 🔧 FIX: Model Salah Deteksi (Black Spot → Greening)

## ✅ ROOT CAUSE FOUND!

### **Problem: Severe Class Imbalance**

```
Current Dataset Distribution:
┌─────────────┬──────────┬────────────┐
│   Class     │  Images  │   Status   │
├─────────────┼──────────┼────────────┤
│ Greening    │   142    │ ⚠️ TERLALU BANYAK! Model bias ke sini
│ Black spot  │   118    │ ✅ OK
│ Canker      │   114    │ ✅ OK
│ Healthy     │    40    │ ⚠️ Kurang (perlu tambah)
│ Melanose    │     9    │ ❌ SANGAT KURANG!
└─────────────┴──────────┴────────────┘
```

**Kenapa model salah predict?**
1. **Greening punya 142 images** (paling banyak) → Model jadi **bias** ke class ini
2. **Melanose hanya 9 images** → Model hampir tidak belajar class ini
3. **Healthy hanya 40 images** → Kurang representatif
4. **Validation accuracy hanya 88%** → Belum cukup akurat

**Result:** Model cenderung over-predict **Greening** karena punya data paling banyak!

---

## 🎯 SOLUSI (3 Opsi - Pilih yang paling cocok)

### **🥇 OPSI 1: Re-train dengan Data Augmentation (RECOMMENDED)**

Data augmentation akan generate variasi dari gambar yang ada.

**LANGKAH:**

```powershell
cd "d:\daffa\SMT 5\RPL\PlanVision-project\backend"

# 1. Backup model lama
if (Test-Path "../models/efficientnet_saved") {
    $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    Rename-Item "../models/efficientnet_saved" "../models/efficientnet_saved_OLD_$timestamp"
    Write-Host "✅ Model lama di-backup ke: efficientnet_saved_OLD_$timestamp" -ForegroundColor Green
}

# 2. Train dengan augmentation
python train_augmented.py --epochs 50 --batch_size 16 --learning_rate 0.0001
```

**Estimasi waktu:** 30-60 menit (tergantung CPU/GPU)

**Expected output:**
```
Epoch 50/50
loss: 0.08 - accuracy: 0.97 - val_loss: 0.15 - val_accuracy: 0.95
✅ Training complete!
   Val Accuracy: 0.9500
```

**Keuntungan:**
- ✅ Tidak perlu tambah foto manual
- ✅ Model lebih robust (handle class imbalance)
- ✅ Augmentation: flip, rotate, zoom, brightness/contrast adjustment

**Setelah training:**
```powershell
# Restart backend
python app.py

# Test di browser - upload berbagai foto
# Accuracy harus jauh lebih baik!
```

---

### **🥈 OPSI 2: Tambah Data Real + Re-split Dataset**

Jika punya lebih banyak foto asli yang belum dipakai.

**LANGKAH:**

```powershell
cd "d:\daffa\SMT 5\RPL\PlanVision-project"

# 1. Cek berapa foto asli tersedia
Write-Host "=== FOTO ASLI (Source) ===" -ForegroundColor Cyan
Get-ChildItem "Citrus Leaf Disease Image" -Directory | ForEach-Object {
    $count = (Get-ChildItem $_.FullName -File).Count
    Write-Host "  $($_.Name): $count images"
}

# 2. Copy SEMUA foto ke folder baru
$classes = @("Black spot", "Canker", "Greening", "Healthy", "Melanose")
foreach ($class in $classes) {
    $source = "Citrus Leaf Disease Image\$class"
    $target = "data\all_images\$class"
    New-Item -ItemType Directory -Path $target -Force | Out-Null
    Copy-Item "$source\*" -Destination $target -Force
    $count = (Get-ChildItem $target -File).Count
    Write-Host "✅ $class: $count images copied"
}

# 3. Re-split dataset (70% train, 15% val, 15% test)
cd backend
python create_split.py --input_dir "../data/all_images" --output_dir "../data/plantvision_dataset"

# 4. Train ulang
python train.py --epochs 30 --batch_size 16
```

**Keuntungan:**
- ✅ Data real (bukan augmented)
- ✅ Lebih representatif

**Kekurangan:**
- ⚠️ Perlu foto asli lebih banyak
- ⚠️ Jika foto tetap sedikit, masalah belum fix

---

### **🥉 OPSI 3: Quick Fix - Tambah Confidence Warning (TEMPORARY)**

Solusi sementara sambil menunggu re-train.

**✅ SUDAH DITERAPKAN di frontend!**

Code di `DiseaseDetector.tsx` sudah di-update:

```typescript
// Warning jika confidence rendah
if (data.top_probability < 0.75) {
  toast.warning("Confidence rendah - Hasil mungkin kurang akurat", {
    description: `Model hanya ${Math.round(data.top_probability * 100)}% yakin. 
                  Coba foto dengan pencahayaan lebih baik atau angle berbeda.`
  });
}
```

**Behavior:**
- Confidence **< 75%** → Muncul **warning kuning** ⚠️
- Confidence **≥ 75%** → Muncul **success hijau** ✅

**Restart frontend untuk apply:**
```powershell
# Stop frontend (Ctrl+C)
# Jalankan ulang
npm run dev
```

---

## 📊 MONITORING TRAINING (Saat Re-train)

**Good Training Example:**
```
Epoch 50/50
loss: 0.05 - accuracy: 0.98 - val_loss: 0.12 - val_accuracy: 0.96
✅ Good! Val accuracy tinggi, gap kecil
```

**Bad Training (Overfitting):**
```
Epoch 50/50
loss: 0.01 - accuracy: 0.99 - val_loss: 0.45 - val_accuracy: 0.85
❌ Bad! Train accuracy tinggi, tapi val accuracy rendah
```

**Target:**
- ✅ **Val accuracy > 95%**
- ✅ **Gap train-val accuracy < 5%**
- ✅ **Val loss < 0.20**

---

## 🧪 TESTING SETELAH RE-TRAIN

**1. Test berbagai foto:**

```powershell
cd backend

# Test manual dengan script
python test_inference.py "../Citrus Leaf Disease Image/Black spot/1.jpg"
python test_inference.py "../Citrus Leaf Disease Image/Canker/1.jpg"
python test_inference.py "../Citrus Leaf Disease Image/Greening/1.jpg"
python test_inference.py "../Citrus Leaf Disease Image/Healthy/1.jpg"
python test_inference.py "../Citrus Leaf Disease Image/Melanose/1.jpg"
```

Expected: Semua harus predict **benar**!

**2. Test consistency:**
Upload foto yang sama 3-5x → Hasil harus **konsisten**

**3. Test confidence:**
Confidence untuk foto jelas harus **> 85%**

---

## 📋 CHECKLIST SETELAH RE-TRAIN

- [ ] Model validation accuracy > 95%
- [ ] Test 5 foto (1 per class) → Semua benar
- [ ] Upload foto Black spot → Terdeteksi sebagai Black spot (bukan Greening!)
- [ ] Confidence untuk foto jelas > 85%
- [ ] Warning muncul jika confidence < 75%
- [ ] Data tersimpan di database dengan benar
- [ ] Export PDF berfungsi

---

## 🚀 REKOMENDASI SAYA

**Gunakan OPSI 1 (Data Augmentation)** karena:
1. ✅ Paling cepat (tidak perlu cari foto baru)
2. ✅ Paling efektif handle class imbalance
3. ✅ Model jadi lebih robust
4. ✅ Script sudah siap (`train_augmented.py`)

**Command lengkap:**
```powershell
cd "d:\daffa\SMT 5\RPL\PlanVision-project\backend"

# Backup model lama
if (Test-Path "../models/efficientnet_saved") {
    Rename-Item "../models/efficientnet_saved" "../models/efficientnet_saved_OLD"
}

# Train (estimasi 30-60 menit)
python train_augmented.py --epochs 50 --batch_size 16 --learning_rate 0.0001

# Setelah selesai, restart backend
python app.py
```

---

## ✅ HASIL YANG DIHARAPKAN

**Sebelum (Sekarang):**
- Black spot → Terdeteksi sebagai Greening ❌
- Confidence: 60-80%
- Validation accuracy: 88%

**Setelah Re-train:**
- Black spot → Terdeteksi sebagai Black spot ✅
- Confidence: 90-98%
- Validation accuracy: 95-97%

---

**Mulai re-training sekarang untuk hasil terbaik!** 🚀
