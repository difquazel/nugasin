# Nugasin — Appearance, Theme Shop, dan Weekly XP

Implementasi lokal: 16 Oktober 2026. Aplikasi vanilla HTML/CSS/JavaScript dan Firebase yang sudah ada dipertahankan. Belum ada deployment atau perubahan database produksi yang dilakukan.

## Fitur

- Light, Dark, dan System Default bekerja terpisah dari tema dekoratif. Preferensi mengikuti perubahan OS, disimpan antar-refresh, dan disinkronkan melalui profil Firestore setelah login.
- Skrip di `<head>` memulihkan appearance sebelum CSS/body tampil. Transisi, kontras gelap, dialog, input, editor catatan, navigasi, dan tampilan mobile diperbaiki.
- Theme Shop menyediakan tema default gratis serta Christmas, Nature, dan Antarctica, masing-masing **3.000 XP**. SVG ringan yang sudah ada dipakai kembali, termasuk Santa/rusa, berang-berang/burung, dan penguin. Posisi karakter animasi diperbaiki.
- Pembelian memerlukan konfirmasi, login, koneksi internet, dan saldo server yang cukup. Tema menjadi milik permanen; mengganti tema yang sudah dimiliki gratis.
- Widget mingguan menampilkan progres terverifikasi, periode WIB, hadiah, status, dan saldo XP. Klik saldo membuka wallet. Hadiah otomatis masuk setelah penyelesaian kelima terverifikasi.
- XP Wallet memisahkan saldo yang bisa dibelanjakan, total diperoleh sepanjang waktu, total dibelanjakan, tema yang dimiliki, dan riwayat transaksi.
- Animasi dekoratif bisa dinonaktifkan. Pengaturan reduced motion juga mematikan konfeti dan gerakan dekoratif.
- Tugas, catatan, kalender, profil, Google Authentication, migrasi data, dan backup JSON tetap menggunakan alur aplikasi yang ada. Kode ruang lokal/SSE dihentikan saat akun Firebase aktif agar tidak menimpa data akun.

## Arsitektur transaksi XP

1. Klien menyimpan tugas dengan ID tetap (UUID untuk tugas baru bila tersedia).
2. Aksi penyelesaian yang dilakukan saat login masuk ke antrean retry per UID. Setelah penulisan Firestore terkonfirmasi, klien mengirim `POST /api/complete-task` dengan `{ "taskId": "..." }` dan Firebase ID token.
3. Backend memverifikasi token, mengambil UID dari token, dan membaca tugas milik UID tersebut. Tugas harus ada, ID cocok, judul valid, serta berstatus `completed`.
4. Transaksi Admin SDK membuat satu receipt permanen dengan ID tugas. Waktu dan minggu receipt berasal dari server; `completedAtMs` atau tanggal browser tidak menentukan kelayakan XP.
5. Receipt baru menaikkan progres minggu. Penyelesaian kelima secara atomik menambahkan **500 XP**, memperbarui wallet, dan membuat reward serta ledger dengan ID minggu unik. Penyelesaian berikutnya tidak menambah hadiah minggu tersebut.
6. Receipt tetap ada jika tugas dibuka ulang, diedit, atau dihapus. ID tugas yang sama tidak bisa dihitung lagi di minggu lain, termasuk jika dokumen tugas dibuat ulang.
7. `POST /api/claim-weekly-reward` merekonsiliasi receipt server, bukan menghitung tugas atau timestamp klien. Tombol “Periksa progres XP” juga mencoba antrean yang tertunda.
8. `POST /api/purchase-theme` hanya menerima ID tema dalam katalog server. Dalam satu transaksi, server memeriksa ownership/ledger, memotong tepat **3.000 XP**, membuka tema, dan menulis purchase serta ledger. Retry pembelian yang sama berhasil tanpa potongan tambahan. Transaksi berbeda bersaing pada wallet yang sama sehingga tidak dapat membuat saldo negatif.

Backend tidak menerima UID, harga, saldo, atau jumlah hadiah dari klien. Respons API tidak disimulasikan menjadi sukses ketika server gagal. Wallet dari localStorage lama diabaikan; saldo lokal lama tidak dimigrasikan menjadi XP sah. `walletVersion` yang naik secara atomik mencegah respons lama mengembalikan saldo sebelum pembelian atau menghapus ownership baru pada tampilan.

Transaksi Firestore membaca sebelum menulis dan dapat diulang oleh SDK saat ada konflik. Perubahan yang terkait dibungkus dalam transaksi yang sama. Lihat [dokumentasi transaksi Firebase](https://firebase.google.com/docs/firestore/manage-data/transactions).

### Batas minggu dan offline

- Zona waktu tetap: **Asia/Jakarta (UTC+7)**.
- Minggu berjalan dari Senin 00:00:00.000 sampai Minggu 23:59:59.999 WIB.
- ID minggu baru adalah tanggal Senin di Jakarta, misalnya `2026-10-12`.
- XP tersimpan lintas minggu; hanya progres mingguan yang berganti. Tab yang dibiarkan terbuka mengecek pergantian minggu setiap 30 detik dan saat kembali mendapat fokus.
- Waktu server pada respons mengoreksi jam tampilan klien. Keputusan hadiah selalu menggunakan waktu backend.
- **Penyelesaian offline dihitung pada minggu saat diverifikasi server**, bukan tanggal browser yang bisa diedit. Tugas tetap tersimpan melalui mekanisme offline Firestore; antrean hanya menyimpan ID permintaan, bukan XP sah.
- Tugas lama yang sudah completed sebelum upgrade tidak dihitung otomatis dengan memindai histori. Aksi penyelesaian baru yang eksplisit masuk antrean verifikasi.
- Key reward/ledger ISO lama seperti `2026-W42` tetap diperiksa supaya upgrade tidak memberikan dua hadiah untuk minggu yang sama. Metadata rewarded lama dimigrasikan menjadi receipt saat diperlukan; penghapusan tugas rewarded lama memerlukan receipt dahulu.

## Struktur Firestore

Semua path berikut berada di `users/{uid}/`:

| Path | Isi utama | Penulis |
| --- | --- | --- |
| `settings/preferences` | Profil, courses, `profile.activeTheme`, `profile.colorMode`, `profile.animationsEnabled`, base vibe | Klien pemilik dengan validasi; backend untuk auto-apply pembelian |
| `tasks/{taskId}` | Tugas yang sudah ada; waktu completion display diperbarui server saat verifikasi | Klien pemilik; backend |
| `notes/{noteId}` | Catatan yang sudah ada | Klien pemilik |
| `schedules/{scheduleId}` | Path jadwal yang sudah ada | Klien pemilik |
| `economy/wallet` | `xpBalance`, `lifetimeXpEarned`, `totalXpSpent`, `purchasedThemes`, `walletVersion` | **Server saja** |
| `taskCompletions/{taskId}` | UID, taskId, weekKey, waktu completion/record server; receipt permanen | **Server saja** |
| `weeks/{YYYY-MM-DD}` | completedCount, requiredCount, rewardXp, rewarded, batas minggu, timezone | **Server saja** |
| `rewards/{YYYY-MM-DD}` | Hadiah mingguan permanen, +500 XP, waktu server | **Server saja** |
| `purchases/theme_{themeId}` | Harga, tema, saldo sebelum/sesudah, waktu pembelian | **Server saja** |
| `xpTransactions/weekly_{YYYY-MM-DD}` | Ledger +500 XP | **Server saja** |
| `xpTransactions/purchase_{themeId}` | Ledger −3.000 XP | **Server saja** |

Tidak perlu menghapus data yang sudah ada atau melakukan reset koleksi. Koleksi baru dibuat oleh backend saat digunakan. Query receipt menggunakan satu field `weekKey`; tidak ada composite index baru yang diwajibkan implementasi ini. Nama wallet lama `lifetimeEarnedXp`/`lifetimeSpentXp` dibaca untuk kompatibilitas, lalu operasi baru menulis field kanonis di tabel.

## Firestore Security Rules

Sumber lengkap yang perlu diterbitkan adalah **`firestore.rules`** di folder proyek ini.

- Hanya pemilik akun dapat membaca data privatnya.
- Klien tidak dapat create/update/delete wallet, progress minggu, receipt, reward, purchase, atau ledger XP.
- Preferences membatasi field yang diizinkan dan memeriksa ownership sebelum tema premium dipasang.
- Tugas memvalidasi ID/schema serta melarang pemalsuan/pengubahan metadata reward lama. Membuka ulang tugas tetap diperbolehkan; receipt melindungi XP.
- Tugas baru tidak membawa flag XP dari browser. Penghapusan tugas rewarded lama diblokir sampai ada receipt server permanen.
- Catatan dan jadwal tetap punya validasi pemilik/schema; warna catatan lama dan base vibe yang digunakan klien tetap diterima.
- Path lain ditolak secara default.

Admin SDK adalah jalur istimewa di server dan melewati rules klien. Karena itu verifikasi token dan validasi transaksi dilakukan di endpoint, sementara private key hanya disimpan di environment server. Lihat [panduan aturan Firebase](https://firebase.google.com/docs/firestore/security/get-started).

## Environment variables

Gunakan `.env.example`. Nilai web berikut boleh dikirim ke browser melalui `/api/firebase-config`:

```text
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
```

Untuk server, pilih salah satu format service account dari proyek Firebase yang sama:

```text
# A: JSON service account lengkap, satu baris
FIREBASE_SERVICE_ACCOUNT_JSON

# B: field terpisah
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

`FIREBASE_PRIVATE_KEY` menerima newline asli atau `\n`. Private key/JSON Admin jangan ditempel ke editor konfigurasi web, jangan diberi prefix public, dan jangan dimasukkan Git. Backend sengaja tidak memakai kredensial default implisit. Tanpa konfigurasi Admin, endpoint mengembalikan 503 yang aman dan tidak memberikan XP/pembelian lokal sebagai fallback.

`PORT` opsional untuk server lokal, default 3000. Tidak ada variabel timezone karena aturan minggu dikunci di Asia/Jakarta.

## Setup Firebase dan Vercel

1. Pertahankan proyek Firebase yang dipakai Nugasin sekarang. Pastikan Google sign-in aktif dan database Firestore tersedia.
2. Tambahkan `localhost` serta domain produksi Vercel pada Firebase Authentication → Settings → Authorized domains.
3. Buat/ambil service account di Firebase Project settings → Service accounts. Isi public config dan kredensial Admin server dalam `.env` lokal atau Environment Variables proyek Vercel.
4. Terbitkan **rules baru sebelum memakai XP di produksi**. Bisa salin `firestore.rules` ke Firebase Console, atau dari root proyek jalankan CLI yang sudah login:

   ```text
   firebase deploy --only firestore:rules --project YOUR_EXISTING_PROJECT_ID
   ```

5. Vercel memakai preset **Other**, install dari `package-lock.json`, Build Command `npm run build`, Output Directory `dist`, dan Node 20 atau lebih baru. `vercel.json` sudah mengatur build/output dan endpoint API. `api/` tetap di root proyek agar dikenali sebagai Functions; jangan mengunggah `dist` saja jika memerlukan backend.
6. Tambahkan env vars pada environment Vercel yang sesuai lalu redeploy. Jangan menyetel Admin service account di frontend.
7. Login Google di deployment tersebut. Selesaikan lima tugas baru, periksa reward/ledger, lalu login akun yang sama pada perangkat kedua untuk mengecek saldo, appearance, dan ownership. Uji pembelian bersaldo cukup melalui emulator/fixture pengujian terlebih dahulu.

Build hanya memasukkan file browser yang diizinkan ke `dist`; `.env`, data lokal, test, dan kode Admin tidak menjadi aset publik. Server lokal juga menolak akses statis ke file tersebut. Referensi konfigurasi: [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json).

## Menjalankan dan menguji

```text
npm ci
npm start
npm test
npm run check
npm run build
```

PowerShell jika port 3000 sedang dipakai:

```powershell
$env:PORT='3107'
npm.cmd start
```

Tes integrasi rules disediakan terpisah dan membutuhkan Firebase CLI serta Java yang didukung emulator:

```text
firebase emulators:exec --only firestore --project demo-nugasin "npm run test:rules"
```

Gunakan project demo untuk tes emulator. Menjalankan `npm run test:rules` tanpa `FIRESTORE_EMULATOR_HOST` akan **skip**, bukan menyatakan rules lulus.

### Hasil verifikasi yang benar-benar dijalankan

- `npm test`: **34/34 tes lulus**, tanpa skip pada suite utama.
- Tes ekonomi memakai Firestore palsu yang memodelkan konflik transaksi dan retry; ini bukan bukti transaksi lintas perangkat pada Firestore produksi.
- `npm run check`: pemeriksaan sintaks 19 file JS dan JSON konfigurasi lulus.
- `npm run build`: lulus; menghasilkan tiga file browser yang diizinkan dalam `dist`. Ini build produksi lokal, bukan deployment/build di layanan Vercel.
- Endpoint lokal: GET privileged API ditolak 405; POST tanpa token ditolak 401; token dengan Admin belum dikonfigurasi mendapat 503; file env/Admin/data tidak dapat diambil sebagai aset statis.
- Browser desktop/mobile: marketplace dan wallet berpindah tab, preview/price tampil, dark mode bertahan setelah refresh, catatan dapat diedit, animasi dapat dimatikan, Escape menutup dialog. Lebar 390 dan 320 piksel diperiksa.
- Boot appearance diuji untuk light/dark/system, cache korup, preferensi tidak valid, dan localStorage yang ditolak.
- `npm run test:rules`: **satu suite skip**, emulator belum berjalan. Aturan belum diverifikasi dengan emulator atau diterbitkan ke cloud.
- Google OAuth langsung, dua perangkat nyata, pembelian dengan wallet cloud, dan deployment Vercel **belum diverifikasi** karena kredensial/infrastruktur proyek belum disediakan.

### Pemetaan 16 kriteria penerimaan

| Kriteria | Bukti/limit saat ini |
| --- | --- |
| 1. Dark mode bertahan setelah refresh | Browser + tes boot/klien lulus |
| 2. Tema dalam light/dark | Preview browser kedua mode + state tema/mode tes klien; premium yang benar-benar dipasang perlu akun cloud |
| 3. Progres setelah tugas valid | Tes service receipt; widget dihubungkan ke snapshot minggu; cloud belum diuji |
| 4–6. Lima tugas +500, lebih dari lima tidak ekstra, toggle tidak menggandakan | Tes ekonomi/retry lulus |
| 7. Reset Senin | Boundary WIB, pergantian tahun, dan minggu berikutnya diuji; timer/listener disediakan |
| 8. Saldo lintas perangkat | Listener per UID + transaksi disediakan; dua perangkat nyata belum diuji |
| 9–12. Harga/persistensi/insufficient/concurrent purchase | Tes ekonomi lulus, termasuk saldo nol dan konflik transaksi |
| 13. Logout/account switching | Tes token/request race, isolasi service per UID, dan reset state; OAuth nyata belum diuji |
| 14. Security rules | Rules diperketat, suite emulator tersedia tetapi masih skip |
| 15. Fitur lama | Browser catatan/navigasi + tes regresi klien; cloud/migrasi penuh belum diuji langsung |
| 16. Build Vercel | Build lokal lulus dan config tersedia; build/deploy di platform belum dijalankan |

## File yang diubah/dibuat

| Kelompok | File |
| --- | --- |
| UI dan integrasi klien (diubah) | `client.js`, `index.html`, `styles.css` |
| Endpoint (diubah) | `api/_firebase-admin.js`, `api/claim-weekly-reward.js`, `api/purchase-theme.js` |
| Endpoint/core baru | `api/complete-task.js`, `lib/economy.js`, `lib/http.js` |
| Keamanan/runtime/build (diubah) | `firestore.rules`, `local-server.js`, `vercel.json`, `package.json`, `.gitignore`, `.vercelignore`, `.env.example` |
| Konfigurasi/script baru | `firebase.json`, `package-lock.json`, `scripts/build.js`, `scripts/check.js` |
| Pengujian baru | `tests/economy.test.js`, `tests/http.test.js`, `tests/client.test.js`, `tests/build.test.js`, `tests/firestore.rules.emulator.js`, `tests/helpers/fake-firestore.js` |
| Dokumentasi | `README.md` (ditambah), `IMPLEMENTATION.md` (baru) |

`firebase-admin` adalah dependency yang sudah ada; tidak ada dependency aplikasi baru ditambahkan. `dist`, cache npm, dan `node_modules` adalah hasil lokal yang diabaikan Git.

## Pekerjaan manual tersisa

1. Isi konfigurasi Firebase web dan service account Admin dari proyek yang sama.
2. Jalankan suite emulator dan terbitkan `firestore.rules`.
3. Deploy/redeploy ke proyek Vercel yang sudah digunakan Nugasin.
4. Jalankan smoke test OAuth, reward, pembelian, logout/ganti akun, offline/reconnect, dan sinkronisasi dua perangkat pada deployment.

Jangan menghapus receipt atau ledger sebagai reset progres. Dokumen minggu baru otomatis memisahkan siklus berikutnya, sementara wallet dan tema tetap permanen.
