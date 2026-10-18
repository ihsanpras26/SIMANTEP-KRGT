# Struktur proyek

## Batas tanggung jawab

`src/main.jsx` memuat font Inter lokal dan memasang React Query serta router.
`app/App.jsx` menangani konfigurasi, sesi, dan gerbang login. Setelah autentikasi,
`app/AuthenticatedApp.jsx` memuat kerangka aplikasi, rute fitur secara lazy,
dan subscription realtime. Halaman login tidak menjalankan query arsip.

| Lokasi                 | Tanggung jawab                                                   |
| ---------------------- | ---------------------------------------------------------------- |
| `app/routes`           | Penghubung data dengan dashboard dan form arsip                  |
| `features/arsip`       | Daftar, detail, form, impor/ekspor, query, mutation, dan retensi |
| `features/auth`        | Login Supabase, pemeriksaan sesi, dan pembersihan cache          |
| `features/dashboard`   | Statistik dan grafik SVG tanpa pustaka grafik tambahan           |
| `features/klasifikasi` | Hierarki kode, pencarian, query, dan CRUD klasifikasi            |
| `features/labels`      | CRUD label, statistik penggunaan, dan assignment massal          |
| `components/layout`    | Sidebar, header, drawer ponsel, dan pencarian cepat              |
| `components/shared`    | Pagination                                                       |
| `components/ui`        | Button, badge, card, input, modal, tabel, dan stat card          |
| `lib`                  | Klien Supabase tunggal dan helper class name                     |
| `styles`               | Token Tailwind CSS 4, kerangka dashboard, dan CSS responsif      |
| `tests`                | Regresi layanan, autentikasi, URL, status, dan alur browser      |
| `scripts`              | Pemeriksaan struktur dan utilitas inspeksi database manual       |

## Alur data

React Query menjadi sumber cache data server. State sementara seperti dialog dan
pilihan baris berada pada komponen; tidak ada salinan data server di Zustand.
Pencarian, filter, urutan, mode tampilan, dan halaman daftar tersimpan di URL.
Mutasi serta realtime menginvalidasi query yang terpengaruh, termasuk jumlah
penggunaan label setelah relasi atau arsip berubah.

`arsipService.js`, `listState.js`, dan `statusUtils.js` mempertahankan perilaku
query versi sebelumnya: pagination server, jumlah hasil yang tepat, urutan stabil,
pencarian literal, batch lengkap untuk sortir turunan/filter status, dan retensi
permanen. Dashboard memuat koleksi lengkap hanya ketika dibuka. Daftar tidak
mengambil seluruh koleksi untuk pencarian biasa. XLSX dimuat saat impor/ekspor.

Detail dan edit menggunakan `/arsip/:id` serta `/arsip/:id/edit`. Parameter `from`
menyimpan tujuan kembali yang dibatasi pada rute daftar. Dokumen Google Drive dan
file pada bucket Supabase yang sudah ada tetap dapat dibuka; iframe pratinjau
baru dimuat setelah pengguna memintanya.

Penyimpanan arsip dan perubahan relasi label merupakan permintaan terpisah.
Jika arsip tersimpan tetapi label gagal, form menyimpan identitas hasil agar
percobaan berikutnya memperbarui arsip yang sama. Impor memvalidasi sebelum
menulis, melaporkan hasil per baris, dan mempertahankan kolom kosong pada mode
pembaruan. Proses ini bukan transaksi lintas baris. Pencegahan duplikasi melalui
pemeriksaan klien tidak menggantikan constraint database untuk penulisan bersamaan.

Tidak ada perubahan skema, migrasi, indeks, fungsi SQL, atau kebijakan RLS dalam
perombakan antarmuka ini. Otorisasi tetap ditentukan Supabase Auth dan RLS.

## Konvensi dan pemeriksaan

- Komponen memakai PascalCase; hook diawali `use`.
- Letakkan logika bisnis dalam fitur terkait; gunakan `ui/` untuk komponen bersama.
- Semua sumber aplikasi harus terjangkau dari entry point, termasuk lazy import.
- Gunakan token dari `styles/index.css`; hindari konfigurasi tema kedua.
- Jalankan `npm run check:structure`, `npm run lint`, `npm test`, dan `npm run build`.
- Untuk perubahan alur pengguna, jalankan `npm run test:e2e` setelah memasang Chromium
  dengan `npx playwright install chromium`. Pengujian menggunakan data contoh lokal
  dan menolak koneksi eksternal selain API contoh yang diintersep.

Detail hasil perombakan ada di [panduan perombakan SaaS](perombakan-saas.md).
