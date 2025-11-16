# 🔧 FIX: Error 'dense_2' - Model Output Key Issue

## ✅ SUDAH DIPERBAIKI!

### Problem:
```
Error in predict_disease: 'dense_2'
```

Model output key `'dense_2'` tidak ada. Setiap model bisa punya nama output layer berbeda tergantung arsitektur.

### Solution Applied:
Code di `app.py` sudah diupdate untuk **otomatis detect output key** (line 301):

```python
# BEFORE (Hardcoded - ERROR!)
predictions_raw = output['dense_2'].numpy()[0]

# AFTER (Dynamic - WORKS!)
output_key = list(output.keys())[0]
predictions_raw = output[output_key].numpy()[0]
```

---

## 🔄 CARA RESTART BACKEND:

### **Opsi 1: Restart via Keyboard (Terminal Flask)**
1. **Fokus ke terminal** tempat Flask running
2. **Tekan Ctrl+C** untuk stop
3. **Jalankan lagi:** `python app.py`

### **Opsi 2: Kill Process via PowerShell**
```powershell
# Kill proses Python yang running
Get-Process | Where-Object {$_.ProcessName -like "*python*"} | Stop-Process -Force

# Jalankan backend lagi
cd "d:\daffa\SMT 5\RPL\PlanVision-project\backend"
python app.py
```

### **Opsi 3: Gunakan Script (Paling Gampang)**
```powershell
cd "d:\daffa\SMT 5\RPL\PlanVision-project\backend"
.\START_BACKEND.bat
```

---

## 🧪 TEST SETELAH RESTART:

1. **Refresh browser** (F5)
2. **Upload foto daun jeruk lagi**
3. **Klik "Deteksi Penyakit"**
4. **Tunggu 2-5 detik**
5. **✅ Hasil harus muncul!**

Expected response:
```json
{
  "top_class": "Canker",
  "top_probability": 0.95,
  "disease_info": {
    "disease": "Citrus Canker (Kanker Jeruk)",
    "severity": "tinggi",
    "symptoms": [...],
    "treatment": [...],
    "prevention": [...]
  }
}
```

---

## 🔍 JIKA MASIH ERROR:

### Debug Output Key:
```powershell
cd backend
python check_model_output.py
```

Output akan menunjukkan:
```
=== MODEL SIGNATURE INFO ===
Output keys: ['dense', 'predictions', atau 'output_0']
```

Jika masih error, update `app.py` line 301 dengan output key yang benar.

---

## ✅ SELANJUTNYA:

Setelah restart backend:
1. Test upload foto dari `Citrus Leaf Disease Image/Canker/1.jpg`
2. Harus terdeteksi sebagai **Canker** dengan confidence tinggi
3. Rekomendasi pengobatan harus muncul lengkap
4. Check database apakah data tersimpan

---

**Restart backend sekarang dan test lagi!** 🚀
