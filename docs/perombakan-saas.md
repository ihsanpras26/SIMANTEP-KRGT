# Perombakan SIMANTEP: dashboard SaaS

Antarmuka SaaS yang ringkas dengan mode terang sebagai bawaan dan mode gelap yang
tersimpan di perangkat. Warna, field, dialog, tabel, dan feedback memakai token
tema yang sama. Halaman login menggunakan foto KRGT dari aset proyek, dikompresi
ke WebP sekitar 165 KB. Inter dimuat lokal; grafik menggunakan SVG responsif.
Navigasi memakai sidebar yang dapat diringkas dan drawer pada ponsel.

Copywriting berfokus pada pekerjaan: Daftar arsip, Tambah arsip, Label arsip, dan
Klasifikasi arsip. Impor serta pembaruan Excel berada di menu Lainnya. Pencarian
menampilkan status memuat, jumlah hasil, dan reset saat tidak ditemukan. Form
menampilkan status penyimpanan, fokus pada kolom yang belum valid, dan konfirmasi
saat pengguna berpindah halaman dengan perubahan yang belum disimpan.

## Fitur yang dipertahankan

- Login admin melalui Supabase Auth dan sesi tersimpan.
- Dashboard jumlah, status, tren, grafik periode, dan arsip terbaru.
- Pencarian nomor surat/perihal/pengirim, filter klasifikasi/label/tanggal/status,
  sorting, pagination, serta tampilan tabel dan kartu.
- Tambah, edit, hapus, detail arsip, penerima surat, label, dan tautan dokumen.
- Impor Excel/CSV, pembaruan massal, template, dan ekspor spreadsheet.
- CRUD klasifikasi berikut hierarki dan retensi aktif/inaktif.
- CRUD label, statistik penggunaan, serta pemasangan/pelepasan label massal.
- Pembaruan melalui realtime dan tautan detail yang dapat dibuka langsung.

Skema, tabel, data, indeks, kebijakan RLS, dan konfigurasi proyek Supabase tidak
diubah. `arsipService.js`, `listState.js`, dan `statusUtils.js` tetap menggunakan
implementasi sebelumnya, termasuk optimasi pagination, urutan stabil, count tepat,
pencarian literal, batch lengkap ketika diperlukan, dan aturan arsip permanen.

## Perubahan perilaku

Pencarian daftar menunggu jeda ketikan 200 ms. Pencarian, filter, sorting, dan
pagination tersimpan pada URL. Hasil lama ditandai ketika query berikutnya berjalan,
dan aksi baris dinonaktifkan hingga hasil baru siap. Pencarian cepat dibuka dengan
Ctrl/Cmd+K dan hanya menjalankan query ketika pengguna mengetik.

Halaman fitur dimuat terpisah. XLSX hanya dimuat saat impor/ekspor, dan pratinjau
dokumen baru memuat iframe setelah diminta. Data server berada di cache React Query;
salinan Zustand serta dependensi grafik/animasi yang tidak diperlukan dihapus.
Query dan realtime baru aktif setelah login. Logout dan pergantian akun membatalkan
query berjalan serta membersihkan cache.

Ekspor mengambil seluruh hasil sesuai filter, bukan hanya halaman yang terlihat.
Impor memperlihatkan validasi sebelum menulis dan melaporkan keberhasilan/kegagalan
per baris. Nilai CSV tetap literal, termasuk nol awal pada kode. Pada pembaruan
massal, kolom kosong mempertahankan nilai tersimpan. Label dikelola terpisah dari
impor. Form mempertahankan identitas arsip yang sudah tersimpan ketika perubahan
label gagal, sehingga percobaan ulang tidak membuat arsip baru.

## Pengukuran build

Perbandingan menggunakan build Vite lokal sebelum dan sesudah perombakan terhadap
baseline commit `e10194a`.

| Aset                         |  Sebelumnya |   Sesudah |
| ---------------------------- | ----------: | --------: |
| JavaScript entry, gzip       |   445,59 kB | 126,29 kB |
| JavaScript entry, tanpa gzip | 1.440,04 kB | 403,19 kB |
| CSS, gzip                    |    15,24 kB |  12,32 kB |

Ukuran unduhan JavaScript entry turun sekitar 71,7%. Chunk halaman dan XLSX dimuat
sesuai kebutuhan; pengukuran ini bukan klaim bahwa seluruh aplikasi atau latensi
pencarian produksi menjadi 71,7% lebih cepat. Dashboard tetap memerlukan koleksi
lengkap untuk perhitungan statistik dengan kontrak database saat ini. Filter status
dan urutan turunan mempertahankan jalur batch lengkap yang sudah ada.

## Verifikasi

- 55 tes regresi lulus: query, URL, pagination, status, autentikasi, pengelolaan
  metadata, impor, mutation, dan kondisi gagal sebagian.
- 25 alur Playwright lulus: login, pencarian, navigasi edit/refresh, tambah/hapus,
  ekspor lintas halaman, impor valid/invalid, percobaan ulang penyimpanan label,
  assignment label, CRUD metadata, fokus dialog/drawer, tema persisten, serta
  perlindungan perubahan ketika navigasi dan keluar akun.
- Halaman utama diuji pada lebar 320, 768, dan 1.440 piksel tanpa overflow halaman.
- ESLint, pemeriksaan 71 sumber/aset terjangkau, dan build produksi lulus.
- CI menjalankan pemeriksaan kode dan alur browser dengan Chromium.

Tes layanan dan browser menggunakan respons Supabase contoh, bukan database
produksi. Login nyata, RLS, realtime lintas sesi, izin dokumen eksternal, dan waktu
respons jaringan produksi belum diverifikasi melalui pengujian ini. Tidak ada
migrasi atau penulisan ke database produksi selama pengembangan. Build frontend
dipublikasikan ke Site privat SIMANTEP yang sudah ada.

Penulisan arsip dan relasi label masih berupa permintaan terpisah, bukan transaksi
lintas tabel. Impor juga dapat berhasil sebagian. Form serta laporan impor
menampilkan keadaan ini. Pemeriksaan duplikasi klien tidak menggantikan constraint
unik database untuk penulisan yang terjadi bersamaan.

## Menjalankan pemeriksaan

Dari `sistem-arsip/`:

```sh
npm ci
npm run check:structure
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Gunakan `PLAYWRIGHT_CHROMIUM_PATH` jika Chromium telah terpasang di lokasi lain.
Pengujian browser memasang konfigurasi contoh sendiri dan memblokir koneksi
eksternal yang tidak termasuk API contoh. Tangkapan layar lokal tersimpan dalam
`work/browser-results/`, yang diabaikan Git. Konfigurasi pengembangan dan deployment
tersedia di [README aplikasi](../sistem-arsip/README.md).
