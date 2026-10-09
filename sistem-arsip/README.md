# Aplikasi SIMANTEP

Panduan arsitektur tersedia di [docs/struktur-proyek.md](../docs/struktur-proyek.md).

## Konfigurasi lokal

Dari direktori `sistem-arsip/`, jalankan `npm ci`, salin `.env.example` ke `.env`, lalu isi:

| Variabel | Penggunaan |
| --- | --- |
| `VITE_SUPABASE_URL` | URL proyek Supabase |
| `VITE_SUPABASE_ANON_KEY` | Kunci publik legacy anon, dilindungi kebijakan RLS |
| `VITE_ADMIN_EMAIL` | Email yang diperiksa alur login saat ini |
| `VITE_ADMIN_PASSWORD` | Pemeriksaan password pada alur login saat ini; terbaca di browser |

Semua `VITE_*` masuk ke bundle frontend. Jangan gunakan service-role/secret key.
Lihat [temuan autentikasi](../docs/audit-struktur.md) sebelum memakai konfigurasi admin di produksi.
Jika konfigurasi Supabase belum tersedia, aplikasi menampilkan pesan konfigurasi.

## Perintah

```sh
npm run dev               # Server pengembangan
npm run check:structure   # Impor relatif dan keterjangkauan kode dari entry point
npm run lint              # Pemeriksaan JavaScript, JSX, dan React Hooks
npm test                  # Tes regresi dengan respons Supabase contoh
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
menggunakan `/arsip/:id` sehingga dapat dibuka langsung dan di-refresh.
Lihat [panduan tahap 1](../docs/ui-ux-tahap-1.md) untuk perilaku query dan pemeriksaan manual.

## Sistem visual

Token warna, font, dan bayangan menggunakan `@theme` Tailwind CSS 4 di
`src/styles/index.css`. Inter dibundel melalui `@fontsource/inter` pada entry point;
tidak memerlukan permintaan font ke layanan eksternal. Kerangka aplikasi menggunakan
sidebar desktop pada lebar 1.024 px ke atas dan drawer pada layar lebih kecil.
Lihat [panduan tahap 2](../docs/ui-ux-tahap-2.md) untuk ukuran, aturan layout, dan pratinjau.
