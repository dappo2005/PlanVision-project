# Panduan Mengunggah Project PlantVision ke GitHub

## Langkah-langkah:

### 1. Inisialisasi Git Repository
```bash
git init
```

### 2. Menambahkan Remote Repository
```bash
git remote add origin https://github.com/dappo2005/PlanVision-project.git
```

### 3. Menambahkan Semua File ke Staging
```bash
git add .
```

### 4. Commit Perubahan
```bash
git commit -m "Initial commit: Add PlantVision website design"
```

### 5. Rename Branch ke main (jika perlu)
```bash
git branch -M main
```

### 6. Push ke GitHub
```bash
git push -u origin main
```

## Catatan:
- Pastikan Anda sudah login ke GitHub di terminal/browser
- Jika repository sudah ada commit, gunakan: `git pull origin main --allow-unrelated-histories` sebelum push
- Jika ada error authentication, gunakan GitHub Personal Access Token atau SSH

## Alternatif dengan GitHub CLI:
Jika sudah install GitHub CLI, bisa menggunakan:
```bash
gh repo clone dappo2005/PlanVision-project
# atau
gh repo create PlanVision-project --private --source=. --remote=origin --push
```

