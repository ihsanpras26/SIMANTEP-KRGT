# Aplikasi SIMANTEP

Acuan terkini: [desain](../DESIGN.md), [panduan pengembangan](../docs/pengembangan.md),
[audit form](../docs/audit-form-arsip.md), dan [struktur proyek](../docs/struktur-proyek.md).

## Konfigurasi lokal

Dari direktori `sistem-arsip/`, jalankan `npm ci`, salin `.env.example` ke `.env`, lalu isi:

| Variabel                        | Penggunaan                                                           |
| ------------------------------- | -------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | URL proyek Supabase                                                  |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Kunci publishable publik Supabase (disarankan)                       |
| `VITE_SUPABASE_ANON_KEY`        | Alternatif kunci publik legacy anon jika publishable key tidak diisi |
| `VITE_AUTH_ENABLED` | Sementara default `false`; isi `true` dan rebuild untuk mewajibkan login |
| `VITE_ADMIN_EMAIL`              | Email akun admin yang diizinkan; wajib saat login aktif          |

Semua `VITE_*` masuk ke bundle frontend. Jangan gunakan service-role/secret key atau
menyimpan kata sandi dalam environment frontend. Login memverifikasi kata sandi langsung
melalui Supabase Auth (`signInWithPassword`); akun admin harus sudah tersedia di Supabase.
Koneksi Supabase wajib dikonfigurasi. Saat login aktif, email admin juga wajib diisi.

Pemeriksaan email dan `getSession` hanya mengatur antarmuka klien. Kebijakan RLS Supabase
tetap harus membatasi akses baca/tulis tabel sesuai akun yang berwenang; menyembunyikan
halaman bukan pengganti otorisasi database. Perubahan frontend ini tidak mengubah skema
atau RLS. Sesi tersimpan dengan email yang tidak cocok tidak membuka ruang kerja.

Saat login aktif, query data dan realtime dipasang setelah sesi admin tersedia. Pergantian akun
atau keluar membatalkan query berjalan dan menghapus cache sebelum sesi berikutnya
ditampilkan. Kegagalan keluar ditampilkan kepada pengguna dan tidak dianggap berhasil.
Dashboard memuat seluruh arsip hanya ketika rutenya dibuka; daftar tetap memakai
pagination server dan pencarian cepat mengambil hasil hanya ketika dialog dibuka.

## Login sementara untuk development

Sakelar dari branch `main` dipertahankan: jika `VITE_AUTH_ENABLED` belum diisi atau
bernilai `false`, aplikasi langsung membuka dashboard tanpa login dan header
menampilkan “Mode development”. Ini berlaku juga pada hasil build/deploy.

Set `VITE_AUTH_ENABLED=true`, isi `VITE_ADMIN_EMAIL`, lalu restart atau rebuild
untuk mengaktifkan halaman login baru dan Supabase Auth. Mode development tidak
membuat sesi admin, mengubah database, atau mengubah kebijakan RLS.

## Perintah

```sh
npm run dev               # Server pengembangan
npm run check:structure   # Impor relatif dan keterjangkauan kode dari entry point
npm run lint              # Pemeriksaan JavaScript, JSX, dan React Hooks
npm test                  # Tes regresi dengan respons Supabase contoh
npm run test:e2e          # Uji alur browser dengan login aktif
npm run test:e2e:development # Uji akses development tanpa login
npm run build             # Bundle produksi ke dist/
npm run preview           # Meninjau hasil build
```

`check:structure` memeriksa impor relatif statis dan dynamic import dengan literal.
Jika menambah entry point independen atau mekanisme impor lain, sesuaikan pemeriksaannya.

Utilitas inspeksi Supabase bersifat baca dan dijalankan terpisah dari aplikasi:

```sh
npm run inspect:schema
npm run inspect:labels
npm run inspect:icon
```

Dua perintah pertama membaca konfigurasi `.env` di direktori aplikasi.
`inspect:icon` memakai konfigurasi dotenv atau environment proses. Jangan menjalankannya
terhadap proyek yang tidak dimaksudkan. Utilitas ini memerlukan tabel dan izin baca yang sesuai;
hasil pemeriksaan satu baris tidak menggantikan dokumentasi skema atau audit RLS.

## Deployment Vercel

- Root Directory: `sistem-arsip`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `dist`
- Konfigurasikan environment melalui dashboard deployment.

`vercel.json` mengarahkan rute SPA ke `index.html` agar refresh URL seperti `/arsip` bekerja.

Daftar arsip menyimpan pencarian, filter, sorting, dan pagination di URL. Detail arsip
menggunakan `/arsip/:id`; pengeditan menggunakan `/arsip/:id/edit`, sehingga keduanya
dapat dibuka langsung dan di-refresh. Parameter `from` mempertahankan URL daftar dan
filternya saat kembali. Setiap halaman fitur dimuat terpisah saat dibuka.
Lihat [panduan pengembangan](../docs/pengembangan.md) untuk kontrak alur saat ini;
[panduan perombakan](../docs/perombakan-saas.md) menyimpan catatan versi sebelumnya.

## Sistem visual

Token warna dan font menggunakan `@theme` Tailwind CSS 4 di
`src/styles/index.css`. Inter dibundel melalui `@fontsource/inter` pada entry point;
tidak memerlukan permintaan font ke layanan eksternal. Kerangka aplikasi menggunakan
sidebar desktop pada lebar 1.024 px ke atas dan drawer pada layar lebih kecil.
Desain mengikuti arahan UX terbaru: mode terang sebagai bawaan, mode gelap tersimpan, aksen violet dan amber,
serta pemisah yang sederhana. Dokumen tahap 1/2 merupakan catatan versi terdahulu.

Sebelum uji browser pertama, jalankan `npx playwright install chromium`. Alternatifnya,
isi `PLAYWRIGHT_CHROMIUM_PATH` dengan path Chromium yang sudah terpasang. Tes menyalakan
server lokal dengan konfigurasi contoh; tidak membaca atau mengubah database produksi.
Hasil browser tersimpan di `work/browser-results/` (diabaikan Git).
