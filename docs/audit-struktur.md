# Audit struktur SIMANTEP KRGT

Audit mengacu pada commit awal `b1134b307e827479bd47e234ef3f705468c20169`.

## Temuan dan perbaikan

| Temuan | Perbaikan |
| --- | --- |
| Komponen bisnis, layout, dan komponen umum bercampur | Pisahkan `features/`, `components/layout`, `components/shared`, dan `components/ui` |
| Form arsip dan pengelola klasifikasi punya versi lama di `pages/` | Hapus versi yang tidak terjangkau dari entry point |
| Header dan sidebar lama menduplikasi layout aktif | Hapus duplikat di `components/ui` yang tidak dipakai |
| Helper Supabase berada bersama utilitas domain | Pindahkan klien tunggal ke `lib/supabaseClient.js` |
| InputField, upload Drive, dan helper lain tidak terhubung | Hapus 15 berkas sumber yang tidak terjangkau beserta aset template dan SDK global yang tidak digunakan |
| Skrip inspeksi berada di root aplikasi | Pindahkan ke `scripts/` dan beri perintah npm yang jelas |
| Nama environment key pada pemeriksaan icon tidak konsisten | Gunakan `VITE_SUPABASE_ANON_KEY` seperti skrip dan aplikasi lain |
| README masih template React/Vite | Tambahkan setup, deployment, konvensi, dan peta tanggung jawab |
| Environment contoh tidak tersedia, pola ignore terbatas | Tambahkan `.env.example` dan abaikan `.env.*` selain contoh |
| ESLint memperlakukan JSX member tags sebagai variabel tidak dipakai | Tambahkan aturan penggunaan tag JSX dan pisahkan globals Node/browser |
| Varian UI diekspor bersama komponen | Pisahkan konstanta Button/Badge ke modul varian |
| Hook App/detail arsip dipanggil setelah early return | Pindahkan guard App setelah hook dan pisahkan guard detail dari komponen berkait hook |
| Handler lihat/edit pada kartu arsip memakai `e` tanpa parameter | Tambahkan parameter event agar klik dapat menghentikan propagasi |
| Dependensi hook dan deklarasi tidak dipakai | Lengkapi dependensi dan hapus deklarasi yang tidak digunakan |

Kode lama tetap dapat diambil melalui riwayat Git. Root aplikasi dan konfigurasi rewrite
Vercel tetap berada di `sistem-arsip/`.

## Verifikasi

Sebelum perapian, build berhasil dan lint melaporkan **86 error, 2 warning**.
Setelah perapian:

- `npm run check:structure`: seluruh impor relatif terselesaikan, tidak ada sumber JS/JSX/CSS yang terputus dari entry point.
- `npm run lint`: tanpa error atau warning.
- `npm run build`: berhasil. Peringatan ukuran chunk besar masih muncul.
- CI menjalankan tiga pemeriksaan tersebut pada push dan pull request.

Pemeriksaan ini tidak mencakup login dengan akun nyata, operasi database produksi,
upload file, atau konfigurasi kebijakan RLS. Utilitas inspeksi tidak dijalankan terhadap database.

## Tindak lanjut yang terpisah dari perapian struktur

1. **Password admin dikompilasi ke browser.** Alur login lama membandingkan input dengan
   `VITE_ADMIN_PASSWORD`, lalu memakai Supabase Auth. Environment `VITE_*` bukan tempat
   menyimpan password. Hapus pemeriksaan password frontend, gunakan Supabase Auth dan
   otorisasi admin yang ditegakkan di backend/RLS. Rotasi password jika sudah pernah
   masuk bundle produksi. Perubahan otorisasi ini memerlukan pengujian akun dan kebijakan
   database; belum diubah dalam refactor struktur ini.
2. **Bundle besar.** Bundle produksi masih memuat modul aplikasi dan spreadsheet secara
   bersamaan. Evaluasi lazy loading halaman dan modul XLSX sebagai perubahan performa tersendiri.
3. **Alur data campuran.** React Query dan Zustand masih menyimpan data yang sama, sementara
   sebagian mutation memakai prop klien. Audit invalidation/realtime dan konsolidasikan akses
   data setelah pengujian alur CRUD tersedia.
4. **Skema database belum terdokumentasi sebagai migration.** Tabel, storage, dan RLS harus
   diinventarisasi dari proyek Supabase yang benar sebelum membuat migration atau mengubah kebijakan.
