# 🎓 Nugasin — Campus Tasks, Notes & Calendar (Cloud-Synchronized with Google Auth)

**Made by Maurence**

Nugasin adalah aplikasi web ruang nugas harian, kalender akademik, dan studio catatan kuliah dengan estetika **Pastel Pop & Soft Bento UI**. Kini dilengkapi dengan **Google Sign-In (Firebase Authentication)** dan **Cloud Firestore Real-Time Synchronization** sehingga seluruh catatan, tugas, mata kuliah, dan profil kampus otomatis tersinkronisasi di semua perangkat (HP, Laptop, Tablet) tanpa perlu ekspor/impor JSON manual.

---

## ✨ Fitur Utama

1. **Google Authentication (`Continue with Google`)**
   - Login satu klik menggunakan akun Google resmi via Firebase Authentication.
   - Sesi login persisten (otomatis pulih saat halaman di-refresh).
   - Menu akun lengkap: foto profil, nama, alamat email, ganti akun, dan logout aman (membersihkan listener & data privat dari memori).
2. **Real-Time Cloud Firestore Database**
   - Struktur database terisolasi per pengguna (`users/{uid}/settings/preferences`, `users/{uid}/tasks/{taskId}`, `users/{uid}/notes/{noteId}`).
   - Sinkronisasi *real-time* antar perangkat menggunakan `onSnapshot` dan *debounced granular writes*.
3. **First-Login Local Data Migration & Backup Protection**
   - Saat pengguna login pertama kali di perangkat yang sudah memiliki catatan/tugas lokal, Nugasin menampilkan dialog migrasi dengan 3 pilihan:
     - **Merge Local Data with Cloud Data** (Gabungkan data lokal & cloud tanpa kehilangan data)
     - **Use Existing Cloud Data** (Gunakan data cloud, sementara cadangan lokal disimpan aman dan bisa dipulihkan kapan saja)
     - **Cancel and Keep Local Data** (Tetap gunakan mode lokal)
4. **Offline Persistence & Accurate Sync Indicator**
   - Didukung oleh Firestore IndexedDB Offline Persistence (`Saved to Cloud`, `Syncing`, `Offline — Changes Pending`, `Sync Failed`, atau `Local Mode`).
5. **Onboarding Profil Mahasiswa & Kustomisasi Avatar**
   - Wajib mengisi Nama Panggilan, Jurusan / Prodi, dan Nama Kampus saat pertama kali masuk.
   - Pilihan 6 karakter avatar preset (3 Cowok & 3 Cewek) atau upload foto profil sendiri.
6. **Optional JSON Export & Import Backup**
   - Fitur unduh/unggah file `.json` tetap tersedia sebagai cadangan manual tambahan.

---

## 🔥 Panduan Setup Firebase Console

1. Buka [Firebase Console](https://console.firebase.google.com/) dan klik **Add project** (buat proyek baru, misalnya `nugasin-cloud`).
2. **Aktifkan Google Authentication**:
   - Buka menu **Build → Authentication → Get started**.
   - Pilih tab **Sign-in method**, klik **Google**, aktifkan toggle **Enable**, pilih email support proyek, lalu klik **Save**.
3. **Tambahkan Authorized Domains**:
   - Masih di **Authentication → Settings → Authorized domains**, pastikan domain berikut terdaftar:
     - `localhost` (sudah otomatis ada)
     - Domain produksi Vercel Anda (contoh: `ngampusin.vercel.app` atau `nugasin.vercel.app`)
4. **Buat Database Cloud Firestore**:
   - Buka menu **Build → Firestore Database → Create database**.
   - Pilih lokasi server terdekat (misal `asia-southeast2` Jakarta atau `asia-southeast1` Singapore).
   - Buka tab **Rules**, salin seluruh isi file [`firestore.rules`](./firestore.rules), lalu klik **Publish**.
5. **Ambil Web App Configuration**:
   - Klik ikon⚙️ **Project settings** → gulir ke bawah ke bagian **Your apps** → klik ikon Web **`</>`**.
   - Daftarkan nama aplikasi (`Nugasin Web`) lalu salin nilai `firebaseConfig`.

---

## ▲ Panduan Deploy ke Vercel

1. Push repositori ini ke GitHub dan impor ke [Vercel](https://vercel.com/new).
2. Di dashboard proyek Vercel, buka **Settings → Environment Variables**, lalu tambahkan variabel berikut dari `firebaseConfig` Anda (lihat [`.env.example`](./.env.example)):
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
3. Klik **Redeploy** pada tab **Deployments** agar variabel environment aktif di endpoint `/api/firebase-config`.

---

## 💻 Menjalankan Secara Lokal

```bash
# Salin .env.example menjadi .env dan isi konfigurasi Firebase Anda
cp .env.example .env

# Jalankan server lokal
npm start
```

Buka `http://localhost:3000` di browser.

## Theme Shop, Dark Mode, dan Weekly XP

Light/Dark/System terpisah dari tema dekoratif. Selesaikan 5 tugas terverifikasi dalam satu minggu WIB untuk memperoleh 500 XP sekali per minggu. Christmas, Nature, dan Antarctica masing-masing berharga 3.000 XP dan terbuka permanen setelah dibeli.

XP dan ownership hanya diubah backend Admin SDK; tidak ada pemberian XP atau pembelian lokal saat backend gagal. Konfigurasikan service account dari proyek Firebase yang sama, lalu terbitkan `firestore.rules`. Lihat [panduan implementasi, struktur database, environment, setup Vercel/Firebase, dan hasil tes](./IMPLEMENTATION.md).

```text
npm ci
npm test
npm run check
npm run build
```

Vercel memakai build `npm run build` dan output `dist` dari `vercel.json`; folder `api` tetap di root sebagai Functions. Build hanya menyalin aset browser yang diizinkan. Untuk rules, jalankan emulator sesuai `IMPLEMENTATION.md`; suite tersebut akan skip jika emulator belum aktif. Kredensial cloud dan deployment tidak disertakan.
