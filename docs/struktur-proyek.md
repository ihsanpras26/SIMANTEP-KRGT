# Struktur proyek

## Batas tanggung jawab

`src/main.jsx` memuat font lokal serta memasang provider React Query, router,
Helmet, dan preferensi reduced motion. `src/app/App.jsx`
menggabungkan rute, sesi login, subscription realtime, dan komponen fitur.

Setiap direktori `features/` menyimpan komponen, halaman, hook, atau utilitas yang
khusus untuk fitur tersebut. Tambahkan subdirektori hanya bila diperlukan.

| Lokasi | Tanggung jawab |
| --- | --- |
| `features/arsip` | Form, daftar, detail, impor spreadsheet, dan status retensi |
| `features/klasifikasi` | Pengelolaan kode klasifikasi dan query terkait |
| `features/labels` | Pengelolaan label, assignment, dan query terkait |
| `features/auth` | Form login dan pesan konfigurasi |
| `features/dashboard` | Statistik, halaman dashboard, dan animasi penghitung |
| `components/layout` | Sidebar, header, layout, dan command palette |
| `components/shared` | Dialog, input pencarian, tooltip, pagination, dan loading |
| `components/ui` | Button, badge, card, input, modal, tabel, dan stat card |
| `lib` | Klien Supabase tunggal dan helper class name |
| `stores` | State Zustand yang digunakan bersama |
| `styles` | CSS global, token `@theme` Tailwind CSS 4, dan animasi |
| `scripts` | Pemeriksaan struktur dan inspeksi database manual |
| `tests` | Regresi fungsi dan query di luar entry point aplikasi |

## Konvensi

- Komponen React memakai PascalCase; hook diawali `use`.
- Komponen khusus fitur berada di fitur tersebut. Komponen tanpa logika bisnis
  yang digunakan lintas fitur berada di `shared/` atau `ui/`.
- Jangan membuat implementasi kedua dengan nama yang sama di `pages/` dan `components/`.
  Halaman khusus fitur ditempatkan di `features/<fitur>/pages/`.
- Konstanta varian UI berada dalam modul terpisah agar Fast Refresh bekerja.
- Gunakan impor relatif ke modul yang memiliki tanggung jawab terkait.
- Semua berkas sumber harus terjangkau dari entry point; hapus prototipe yang tidak dipakai
  atau dokumentasikan dan daftarkan entry point independennya.
- Jalankan `npm run check:structure`, `npm run lint`, `npm test`, dan `npm run build` sebelum push.

## Alur data saat ini

Sistem visual memakai token CSS di `src/styles/index.css`; jangan menambahkan
konfigurasi tema kedua. `tailwind.config.js` lama tidak dimuat oleh konfigurasi
Tailwind CSS 4 dan telah dihapus. Impor font dari paket npm berada di `src/main.jsx`
agar Vite dapat menyelesaikan URL aset font saat build.

Hook fitur menggunakan React Query untuk membaca Supabase. `App.jsx` menyinkronkan hasil
query ke store bersama dan memasang subscription realtime. Beberapa komponen masih memakai
store atau prop `supabase` secara langsung. Struktur ini mempertahankan alur yang ada;
penyatuan seluruh mutation dan invalidation dapat dilakukan sebagai refactor terpisah.

Fitur arsip aktif memakai tautan Google Drive dan/atau file Supabase Storage. Implementasi
upload Google Drive lama tidak terhubung ke aplikasi, sehingga dihapus bersama pemuatan
SDK global yang tidak digunakan. Tautan Google Drive pada fitur aktif tetap tersedia.
