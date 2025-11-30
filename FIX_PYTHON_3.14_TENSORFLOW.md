# 🔧 Fix: Python 3.14 Tidak Support TensorFlow 2.15.0

## ❌ **Masalah**

```
ERROR: Could not find a version that satisfies the requirement tensorflow==2.15.0
```

**Penyebab**: Python 3.14 terinstall, tapi TensorFlow 2.15.0 hanya support Python 3.8-3.11.

---

## ✅ **Solusi: Install Python 3.11**

### **Opsi 1: Install Python 3.11 (Recommended)**

1. **Download Python 3.11**:
   - Buka https://www.python.org/downloads/release/python-3119/
   - Download "Windows installer (64-bit)"
   - **PENTING**: Saat install, centang **"Add Python to PATH"**

2. **Install Python 3.11**:
   - Run installer
   - Pastikan centang **"Add Python to PATH"**
   - Klik "Install Now"

3. **Restart VSCode** setelah install

4. **Test**:
   ```bash
   py -3.11 --version
   ```
   Seharusnya muncul: `Python 3.11.9`

---

### **Opsi 2: Pakai Virtual Environment dengan Python 3.11**

**Setelah Python 3.11 terinstall**:

1. **Buat virtual environment**:
   ```bash
   py -3.11 -m venv venv
   ```

2. **Aktifkan virtual environment**:
   ```bash
   # PowerShell
   .\venv\Scripts\Activate.ps1
   
   # ATAU Command Prompt
   venv\Scripts\activate.bat
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Jalankan Flask**:
   ```bash
   python app.py
   ```

---

## 🚀 **Langkah Lengkap**

### **STEP 1: Install Python 3.11**

1. **Download**: https://www.python.org/downloads/release/python-3119/
2. **Install** dengan "Add Python to PATH" dicentang
3. **Restart VSCode**

### **STEP 2: Buat Virtual Environment**

**Di terminal VSCode** (di folder `backend`):

```bash
# Buat virtual environment dengan Python 3.11
py -3.11 -m venv venv
```

### **STEP 3: Aktifkan Virtual Environment**

**PowerShell**:
```bash
.\venv\Scripts\Activate.ps1
```

**Command Prompt**:
```bash
venv\Scripts\activate.bat
```

**Setelah aktif**, prompt akan berubah menjadi:
```
(venv) PS D:\daffa\SMT 5\RPL\PlanVision-project\backend>
```

### **STEP 4: Install Dependencies**

```bash
pip install -r requirements.txt
```

**Tunggu sampai selesai** (5-10 menit).

### **STEP 5: Jalankan Flask**

```bash
python app.py
```

**Seharusnya Flask akan running**:
```
* Running on http://0.0.0.0:5000
```

---

## 🔍 **Cek Versi Python**

**Setelah install Python 3.11**, cek:

```bash
py -3.11 --version
```

**Seharusnya muncul**: `Python 3.11.9`

**Cek semua Python yang terinstall**:
```bash
py --list
```

---

## ⚠️ **Jika Python 3.11 Tidak Terdeteksi**

### **Cara 1: Install Ulang dengan PATH**

1. **Uninstall Python 3.14** (opsional, atau biarkan)
2. **Install Python 3.11** dengan "Add Python to PATH" dicentang
3. **Restart VSCode**

### **Cara 2: Pakai Full Path**

Cari lokasi Python 3.11:
- Biasanya: `C:\Users\<username>\AppData\Local\Programs\Python\Python311\python.exe`

Pakai full path:
```bash
C:\Users\<username>\AppData\Local\Programs\Python\Python311\python.exe -m venv venv
```

---

## 📋 **Alternatif: Update TensorFlow (Tidak Recommended)**

Jika tidak mau install Python 3.11, bisa update TensorFlow ke versi yang support Python 3.14:

**Edit `requirements.txt`**:
```
tensorflow==2.20.0
```

**Tapi ini mungkin ada breaking changes!** Lebih baik install Python 3.11.

---

## ✅ **Checklist**

- [ ] Python 3.11 sudah terinstall
- [ ] Virtual environment sudah dibuat (`py -3.11 -m venv venv`)
- [ ] Virtual environment sudah diaktifkan
- [ ] Dependencies sudah di-install (`pip install -r requirements.txt`)
- [ ] Flask bisa jalan (`python app.py`)
- [ ] Flask running di port 5000

---

## 🎯 **Quick Start**

**Setelah Python 3.11 terinstall**:

```bash
# Di folder backend
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

---

**Install Python 3.11 dulu, lalu buat virtual environment!** 🚀


