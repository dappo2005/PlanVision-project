# 🔧 Fix: Python Not Found di Windows

## ❌ **Error yang Terjadi**

```
Python was not found; run without arguments to install from the Microsoft Store
```

**Penyebab**: Python tidak terinstall atau tidak ada di PATH.

---

## ✅ **Solusi**

### **Opsi 1: Install Python (Jika Belum Install)**

1. **Download Python**:
   - Buka https://www.python.org/downloads/
   - Download Python 3.11 (atau versi terbaru)
   - **PENTING**: Saat install, centang **"Add Python to PATH"**

2. **Install Python**:
   - Run installer
   - Pastikan centang **"Add Python to PATH"** ← **PENTING!**
   - Klik "Install Now"

3. **Restart VSCode** setelah install

4. **Test**:
   ```bash
   python --version
   ```

---

### **Opsi 2: Python Sudah Install Tapi Tidak di PATH**

Jika Python sudah install tapi tidak dikenali:

#### **Cara 1: Pakai `py` Launcher (Windows)**

Windows biasanya punya Python Launcher. Coba pakai:

```bash
py app.py
```

**ATAU**:

```bash
py -3.11 app.py
```

#### **Cara 2: Pakai Full Path**

Cari lokasi Python.exe:

1. **Cari Python.exe**:
   - Biasanya di: `C:\Users\<username>\AppData\Local\Programs\Python\Python311\python.exe`
   - ATAU: `C:\Python311\python.exe`
   - ATAU: `C:\Program Files\Python311\python.exe`

2. **Pakai full path**:
   ```bash
   C:\Users\<username>\AppData\Local\Programs\Python\Python311\python.exe app.py
   ```

#### **Cara 3: Tambahkan Python ke PATH**

1. **Cari lokasi Python.exe** (lihat Cara 2)

2. **Tambahkan ke PATH**:
   - Tekan `Win + R`
   - Ketik `sysdm.cpl`, tekan Enter
   - Tab "Advanced" → "Environment Variables"
   - Di "System variables", cari "Path" → Edit
   - Klik "New" → Tambahkan path Python (misalnya: `C:\Users\<username>\AppData\Local\Programs\Python\Python311`)
   - Klik "New" lagi → Tambahkan Scripts folder (misalnya: `C:\Users\<username>\AppData\Local\Programs\Python\Python311\Scripts`)
   - OK semua

3. **Restart VSCode**

4. **Test**:
   ```bash
   python --version
   ```

---

### **Opsi 3: Install via Microsoft Store (Quick Fix)**

Windows menyarankan install dari Microsoft Store:

1. **Klik link** yang muncul di error
2. **Install Python dari Microsoft Store**
3. **Restart VSCode**
4. **Test**:
   ```bash
   python app.py
   ```

---

## 🔍 **Cek Apakah Python Sudah Install**

### **Cara 1: Cek di Command Prompt**

Buka Command Prompt baru (bukan PowerShell), ketik:

```bash
python --version
```

**ATAU**:

```bash
py --version
```

### **Cara 2: Cek di File Explorer**

1. Buka File Explorer
2. Navigate ke: `C:\Users\<username>\AppData\Local\Programs\Python\`
3. Cek apakah ada folder Python (misalnya: `Python311`)

### **Cara 3: Cek di Start Menu**

1. Tekan `Win`
2. Ketik "Python"
3. Cek apakah ada Python di hasil pencarian

---

## 🎯 **Quick Fix (Paling Mudah)**

### **Coba Pakai `py` Launcher:**

```bash
py app.py
```

**ATAU**:

```bash
py -3 app.py
```

**ATAU**:

```bash
py -3.11 app.py
```

Windows biasanya punya Python Launcher yang otomatis detect Python.

---

## 📋 **Langkah Setelah Python Bisa Jalan**

Setelah Python bisa jalan:

1. **Install dependencies** (jika belum):
   ```bash
   pip install -r requirements.txt
   ```

2. **Jalankan Flask**:
   ```bash
   python app.py
   # atau
   py app.py
   ```

3. **Tunggu sampai Flask running**:
   ```
   * Running on http://0.0.0.0:5000
   ```

4. **Jangan tutup terminal ini!** Biarkan Flask running.

5. **Buka terminal baru** untuk ngrok:
   ```bash
   ngrok http 5000
   ```

---

## 🆘 **Troubleshooting**

### **Error: "pip is not recognized"**
- Install Python dengan "Add Python to PATH" dicentang
- ATAU pakai: `py -m pip install -r requirements.txt`

### **Error: "No module named flask"**
- Install dependencies: `pip install -r requirements.txt`
- ATAU: `py -m pip install -r requirements.txt`

### **Error: "Port 5000 already in use"**
- Cek apakah Flask sudah running di terminal lain
- ATAU tutup aplikasi yang pakai port 5000

---

## ✅ **Checklist**

- [ ] Python sudah terinstall
- [ ] Python ada di PATH (atau pakai `py` launcher)
- [ ] Dependencies sudah di-install (`pip install -r requirements.txt`)
- [ ] Flask bisa jalan (`python app.py` atau `py app.py`)
- [ ] Flask running di port 5000
- [ ] Ngrok sudah running (`ngrok http 5000`)

---

**Coba dulu pakai `py app.py` (Python Launcher)!** 🚀


