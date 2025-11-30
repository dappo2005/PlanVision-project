# 📦 Install Dependencies untuk Backend

## ✅ **Status Saat Ini**
- ✅ Python sudah ada (bisa jalan dengan `py app.py`)
- ❌ Dependencies belum di-install (tensorflow tidak ada)

---

## 🚀 **Langkah Install Dependencies**

### **STEP 1: Install Dependencies**

**Di terminal VSCode** (di folder `backend`), jalankan:

```bash
pip install -r requirements.txt
```

**ATAU** jika `pip` tidak dikenali:

```bash
py -m pip install -r requirements.txt
```

**Tunggu sampai selesai** (bisa 5-10 menit, terutama untuk TensorFlow).

---

### **STEP 2: Verifikasi Install**

Setelah install selesai, test apakah dependencies sudah terinstall:

```bash
py -m pip list
```

**Cek apakah ada**:
- tensorflow
- flask
- mysql-connector-python
- dll

---

### **STEP 3: Jalankan Flask**

Setelah dependencies terinstall:

```bash
py app.py
```

**Seharusnya Flask akan running**:
```
* Running on http://0.0.0.0:5000
```

---

## ⚠️ **Jika Error Saat Install**

### **Error: "pip is not recognized"**

Pakai:
```bash
py -m pip install -r requirements.txt
```

### **Error: "No module named 'pip'"**

Install pip dulu:
```bash
py -m ensurepip --upgrade
```

Lalu:
```bash
py -m pip install -r requirements.txt
```

### **Error: TensorFlow tidak bisa di-install**

TensorFlow butuh Python 3.8-3.11. Cek versi Python:

```bash
py --version
```

Jika Python > 3.11, install Python 3.11:
1. Download Python 3.11 dari https://www.python.org/downloads/
2. Install dengan "Add Python to PATH" dicentang
3. Restart VSCode
4. Coba lagi: `py -3.11 -m pip install -r requirements.txt`

---

## 📋 **Dependencies yang Akan Di-Install**

Dari `requirements.txt`:
- flask
- flask-cors
- mysql-connector-python
- bcrypt
- pillow
- scipy
- tensorflow==2.15.0 (ini yang paling besar, ~500MB)
- werkzeug
- python-dotenv
- google-generativeai
- protobuf

**Total waktu install**: ~5-10 menit (tergantung internet).

---

## 🎯 **Quick Start**

**Di terminal VSCode** (pastikan di folder `backend`):

```bash
# Install dependencies
py -m pip install -r requirements.txt

# Tunggu sampai selesai (5-10 menit)

# Jalankan Flask
py app.py
```

---

## ✅ **Setelah Dependencies Terinstall**

1. **Flask akan running** di port 5000
2. **Jangan tutup terminal ini!** Biarkan Flask running
3. **Buka terminal baru** untuk ngrok:
   ```bash
   ngrok http 5000
   ```

---

**Jalankan: `py -m pip install -r requirements.txt`** 🚀


