# Nugasin ✨ — Catatan Kampus, Tugas Harian & Kalender Online
**Made by Maurence**

Website produktivitas mahasiswa untuk mencatat materi kuliah, mengelola daftar tugas harian & sub-tugas, memantau kalender akademik, serta menyimpan catatan secara online di dalam link permanen dan cloud.

---

## 🚀 Cara Mudah Deploy ke Vercel

Proyek ini sudah dikonfigurasi penuh dengan `vercel.json` dan Serverless API (`api/workspace.js` & `api/health.js`), sehingga **langsung siap di-deploy ke Vercel tanpa pengaturan tambahan (Zero-Config)**.

### Cara 1: Deploy Langsung lewat Terminal (Paling Cepat — 1 Menit)
1. Buka terminal di folder proyek ini (`c:\Users\Nitro V15\Downloads\Website`).
2. Jalankan perintah berikut:
   ```bash
   npx vercel
   ```
3. Login ke akun Vercel kamu jika diminta, lalu tekan **Enter** untuk semua pertanyaan default.
4. Untuk deploy ke link utama (*Production*), jalankan:
   ```bash
   npx vercel --prod
   ```

### Cara 2: Deploy via GitHub Dashboard Vercel
1. Upload/push seluruh isi folder ini ke repository GitHub baru milikmu:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Nugasin by Maurence"
   git branch -M main
   git remote add origin https://github.com/username/nama-repo.git
   git push -u origin main
   ```
2. Buka [vercel.com/new](https://vercel.com/new) dan pilih repository GitHub tersebut.
3. Langsung klik **Deploy** (tidak perlu mengubah *Build Command* atau *Output Directory*).

---

## 💻 Menjalankan Secara Lokal
```bash
npm start
```
Lalu buka `http://localhost:3000` di browser.
