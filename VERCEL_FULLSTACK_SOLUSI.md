# 🚀 Hosting Fullstack di Vercel Saja - Solusi

## ✅ **BISA! Vercel Bisa Handle Fullstack**

Vercel bisa handle backend API dengan **Serverless Functions**, dan bisa connect ke MySQL external (termasuk MySQL Workbench di laptop teman).

---

## 🎯 **Opsi 1: Vercel + MySQL External (Recommended)**

### **Setup:**

1. **Backend API di Vercel** (Serverless Functions)
2. **MySQL tetap di laptop teman** (via ngrok untuk akses public)
3. **Frontend di Vercel** (sudah ada)

---

## 📋 **Langkah Setup**

### **STEP 1: Setup Backend API di Vercel**

Vercel menggunakan **Serverless Functions** untuk backend API.

1. **Buat folder `api/` di root project**:
   ```
   project/
   ├── api/
   │   ├── login.js          (atau .ts)
   │   ├── register.js
   │   ├── predict.js
   │   └── ...
   ├── src/
   ├── public/
   └── package.json
   ```

2. **Buat API endpoint** (contoh: `api/login.js`):
   ```javascript
   // api/login.js
   import mysql from 'mysql2/promise';
   
   export default async function handler(req, res) {
     if (req.method !== 'POST') {
       return res.status(405).json({ error: 'Method not allowed' });
     }
   
     try {
       // Connect ke MySQL (bisa via ngrok atau external MySQL)
       const connection = await mysql.createConnection({
         host: process.env.DB_HOST,
         user: process.env.DB_USER,
         password: process.env.DB_PASSWORD,
         database: process.env.DB_NAME,
         port: process.env.DB_PORT || 3306
       });
   
       const { email, password } = req.body;
       
       // Query database
       const [rows] = await connection.execute(
         'SELECT * FROM users WHERE email = ?',
         [email]
       );
   
       await connection.end();
   
       // Logic login...
       return res.status(200).json({ success: true, user: rows[0] });
     } catch (error) {
       return res.status(500).json({ error: error.message });
     }
   }
   ```

3. **Install dependencies**:
   ```bash
   npm install mysql2
   ```

---

### **STEP 2: Setup MySQL Access (2 Opsi)**

#### **Opsi A: Pakai Ngrok (Quick Fix)**

**Di Laptop Teman** (yang punya MySQL):

1. **Install ngrok**:
   ```bash
   # Download dari https://ngrok.com
   ngrok config add-authtoken <token>
   ```

2. **Start ngrok untuk MySQL**:
   ```bash
   ngrok tcp 3306
   ```

3. **Dapatkan public URL**:
   - Ngrok akan generate: `tcp://0.tcp.ngrok.io:12345`
   - **Copy host dan port** (misalnya: `0.tcp.ngrok.io:12345`)

4. **Update Vercel Environment Variables**:
   ```
   DB_HOST=0.tcp.ngrok.io
   DB_PORT=12345
   DB_USER=root
   DB_PASSWORD=<password>
   DB_NAME=plantvision_db
   ```

**⚠️ Catatan**: URL ngrok berubah setiap restart (free plan)

---

#### **Opsi B: Pakai External MySQL (Recommended untuk Production)**

**Gunakan MySQL hosting gratis:**

1. **PlanetScale** (Recommended):
   - https://planetscale.com
   - Gratis, MySQL compatible
   - Tidak perlu ngrok

2. **Aiven MySQL**:
   - https://aiven.io
   - Gratis tier tersedia

3. **Railway MySQL** (jika bisa):
   - Create MySQL database
   - Copy connection details

**Setup:**
- Export database dari laptop teman
- Import ke external MySQL
- Update Vercel environment variables dengan connection details baru

---

### **STEP 3: Set Environment Variables di Vercel**

1. **Buka Vercel Dashboard** → Project → Settings → Environment Variables

2. **Tambahkan**:
   ```
   DB_HOST=<MySQL host>
   DB_PORT=3306
   DB_USER=<MySQL user>
   DB_PASSWORD=<MySQL password>
   DB_NAME=<database name>
   ```

3. **Redeploy** project

---

### **STEP 4: Update Frontend untuk Pakai API Vercel**

Frontend sudah di Vercel, jadi API endpoint akan otomatis tersedia di:
- `https://your-project.vercel.app/api/login`
- `https://your-project.vercel.app/api/register`
- dll

**Update frontend** untuk pakai API Vercel:
```typescript
// Ganti dari localhost:5000 ke Vercel API
const API_URL = import.meta.env.VITE_API_URL || '/api';
// Atau langsung pakai relative path: '/api'
```

---

## ⚠️ **Limitasi Vercel Serverless Functions**

### **1. Timeout Limit:**
- **Free tier**: 10 detik per request
- **Pro tier**: 60 detik per request
- **ML Model inference** mungkin terlalu lama

### **2. File Size Limit:**
- **Function code**: Max 50MB
- **Request body**: Max 4.5MB
- **ML Model** mungkin terlalu besar

### **3. Cold Start:**
- Function akan "sleep" jika tidak dipakai
- Request pertama akan lambat (cold start)

---

## 🎯 **Solusi untuk ML Model**

Jika ML model terlalu besar atau inference terlalu lama:

### **Opsi 1: Pakai External ML Service**
- Deploy model ke **Hugging Face Inference API**
- Atau **Google Cloud AI Platform**
- Atau **AWS SageMaker**

### **Opsi 2: Skip ML di Vercel, Pakai Backend Terpisah**
- Frontend + API biasa di Vercel
- ML inference di backend terpisah (Render/Railway)
- Atau pakai **serverless ML** seperti **Modal.com**

---

## 📋 **Struktur Project untuk Vercel Fullstack**

```
project/
├── api/                    # Serverless Functions
│   ├── login.js
│   ├── register.js
│   ├── predict.js
│   └── ...
├── src/                    # Frontend React
│   ├── components/
│   └── ...
├── public/                 # Static files
├── package.json
└── vercel.json            # Vercel config (opsional)
```

---

## 🚀 **Quick Start: Convert Backend ke Vercel Functions**

### **1. Install Dependencies:**
```bash
npm install mysql2
```

### **2. Buat API Endpoint** (contoh: `api/login.js`):
```javascript
import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    const { email, password } = req.body;
    
    // Your login logic here...
    
    await connection.end();
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

### **3. Deploy ke Vercel:**
```bash
vercel
```

---

## ✅ **Checklist**

- [ ] Buat folder `api/` di root project
- [ ] Convert backend routes ke Vercel Functions
- [ ] Setup MySQL access (ngrok atau external MySQL)
- [ ] Set environment variables di Vercel
- [ ] Update frontend untuk pakai `/api` endpoints
- [ ] Deploy ke Vercel
- [ ] Test semua endpoints

---

## 🎉 **Keuntungan Vercel Fullstack**

✅ **Satu platform** untuk frontend + backend  
✅ **Tidak perlu deploy terpisah**  
✅ **Auto-scaling** (serverless)  
✅ **Gratis** (free tier)  
✅ **CDN global** untuk performa cepat  

---

## ⚠️ **Catatan Penting**

1. **ML Model**: Mungkin perlu solusi terpisah jika terlalu besar/lama
2. **MySQL Access**: Perlu ngrok atau external MySQL
3. **Timeout**: Perhatikan limit 10 detik (free tier)
4. **Cold Start**: Request pertama mungkin lambat

---

**Bisa pakai Vercel fullstack! Tapi perlu convert backend ke Serverless Functions.** 🚀


