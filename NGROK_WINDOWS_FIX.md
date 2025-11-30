# 🔧 Fix: Ngrok Command di Windows

## ❌ **Error yang Terjadi**

```
'config' is not recognized as an internal or external command
```

**Penyebab**: Command tidak lengkap, harus pakai `ngrok` di depan.

---

## ✅ **Solusi**

### **Opsi 1: Pakai Full Command (Recommended)**

**Di terminal**, ketik **LENGKAP** dengan `ngrok` di depan:

```bash
ngrok config add-authtoken 36CxW0w4SIUCCYSk5xOjBq0gPiP_3e9pxsAbaocDvzqLBmLXx
```

**Bukan**:
```bash
config add-authtoken ...  ❌ SALAH
```

**Tapi**:
```bash
ngrok config add-authtoken ...  ✅ BENAR
```

---

### **Opsi 2: Jika Ngrok Tidak Dikenali**

Jika muncul error `'ngrok' is not recognized`, berarti ngrok tidak ada di PATH.

#### **Cara 1: Pindah ke Folder Ngrok**

1. **Cari folder ngrok.exe** (misalnya di `C:\ngrok\` atau `C:\Users\...\Downloads\`)
2. **Buka Command Prompt di folder tersebut**:
   - Buka File Explorer
   - Navigate ke folder ngrok
   - Klik address bar, ketik `cmd`, tekan Enter
3. **Jalankan command**:
   ```bash
   ngrok config add-authtoken 36CxW0w4SIUCCYSk5xOjBq0gPiP_3e9pxsAbaocDvzqLBmLXx
   ```

#### **Cara 2: Pakai Full Path**

**Di terminal**, ketik full path ke ngrok.exe:

```bash
C:\ngrok\ngrok.exe config add-authtoken 36CxW0w4SIUCCYSk5xOjBq0gPiP_3e9pxsAbaocDvzqLBmLXx
```

**Ganti `C:\ngrok\`** dengan path ngrok.exe Anda yang sebenarnya.

#### **Cara 3: Tambahkan ke PATH (Permanen)**

1. **Copy ngrok.exe** ke folder seperti `C:\ngrok\`
2. **Tambahkan ke PATH**:
   - Tekan `Win + R`
   - Ketik `sysdm.cpl`, tekan Enter
   - Tab "Advanced" → "Environment Variables"
   - Di "System variables", cari "Path" → Edit
   - Klik "New" → Tambahkan `C:\ngrok\`
   - OK semua
3. **Restart Command Prompt**
4. **Jalankan command**:
   ```bash
   ngrok config add-authtoken 36CxW0w4SIUCCYSk5xOjBq0gPiP_3e9pxsAbaocDvzqLBmLXx
   ```

---

## 📋 **Langkah Lengkap**

### **STEP 1: Cari Lokasi ngrok.exe**

1. **Buka File Explorer**
2. **Cari file `ngrok.exe`** (bisa di Downloads atau folder lain)
3. **Copy path folder** (misalnya: `C:\Users\ASUS\Downloads\ngrok.exe`)

### **STEP 2: Buka Command Prompt di Folder Ngrok**

**Opsi A: Via File Explorer**
1. Buka folder yang berisi `ngrok.exe`
2. Klik address bar
3. Ketik `cmd`, tekan Enter
4. Command Prompt akan terbuka di folder tersebut

**Opsi B: Via Command Prompt**
1. Buka Command Prompt
2. Navigate ke folder ngrok:
   ```bash
   cd C:\Users\ASUS\Downloads
   # atau path ngrok.exe Anda
   ```

### **STEP 3: Jalankan Command**

**Di Command Prompt**, ketik:

```bash
ngrok config add-authtoken 36CxW0w4SIUCCYSk5xOjBq0gPiP_3e9pxsAbaocDvzqLBmLXx
```

**Tekan Enter**

**Output yang benar:**
```
Authtoken saved to configuration file: C:\Users\...\AppData\Local\ngrok\ngrok.yml
```

---

### **STEP 4: Start Ngrok**

**Setelah auth token berhasil**, jalankan:

```bash
ngrok http 5000
```

**Pastikan Flask sudah running di port 5000 dulu!**

---

## 🎯 **Quick Fix (Paling Mudah)**

1. **Buka File Explorer**
2. **Cari folder ngrok.exe** (misalnya di Downloads)
3. **Klik address bar** → ketik `cmd` → Enter
4. **Di Command Prompt yang muncul**, ketik:
   ```bash
   ngrok config add-authtoken 36CxW0w4SIUCCYSk5xOjBq0gPiP_3e9pxsAbaocDvzqLBmLXx
   ```
5. **Tekan Enter**

---

## ✅ **Setelah Berhasil**

Setelah auth token berhasil di-set, lanjutkan ke:

1. **Start Flask** (di terminal lain):
   ```bash
   cd backend
   python app.py
   ```

2. **Start ngrok**:
   ```bash
   ngrok http 5000
   ```

3. **Copy URL ngrok** dari output

4. **Update Vercel** dengan URL ngrok

---

## 🆘 **Jika Masih Error**

### **Error: "ngrok is not recognized"**
- Pastikan Anda di folder yang berisi `ngrok.exe`
- ATAU pakai full path: `C:\path\to\ngrok.exe config add-authtoken ...`

### **Error: "authtoken invalid"**
- Pastikan token sudah di-copy dengan benar
- Tidak ada spasi di awal/akhir token
- Token harus lengkap

### **Error: "port 5000 already in use"**
- Pastikan Flask sudah running di port 5000
- ATAU cek apakah port 5000 dipakai aplikasi lain

---

**Coba lagi dengan command lengkap: `ngrok config add-authtoken ...`** 🚀


