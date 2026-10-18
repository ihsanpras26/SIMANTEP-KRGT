# Panduan pengembangan

## Menjalankan dan mengubah aplikasi

Gunakan Node.js 22.12+ dan npm. Root aplikasi adalah `sistem-arsip/`.

```sh
cd sistem-arsip
npm ci
cp .env.example .env
# Isi konfigurasi Supabase publik yang sesuai.
npm run dev
```

Detail environment ada di [README aplikasi](../sistem-arsip/README.md).
Semua `VITE_*` masuk ke bundle frontend; jangan menaruh kata sandi, secret key,
atau service-role key di sana. File `.env` tidak dimasukkan ke Git.

Sakelar sementara dari `main` dipertahankan: hanya `VITE_AUTH_ENABLED=true`
yang mewajibkan login. Nilai kosong/false membuka mode development dan tidak
membuat sesi admin. Jika login aktif, `VITE_ADMIN_EMAIL` wajib sesuai akun
Supabase Auth. Perubahan environment memerlukan restart/rebuild. RLS tetap
menentukan hak akses data pada kedua mode.

## Peta perubahan

| Area | Sumber utama |
| --- | --- |
| Konfigurasi dan gerbang sesi | `src/app/App.jsx`, `src/features/auth/` |
| Router, lazy route, realtime | `src/app/AuthenticatedApp.jsx`, `src/app/routes/` |
| Perhitungan dashboard | `src/app/dashboardData.js` |
| Tampilan laporan | `src/features/dashboard/` |
| Pagination, filter, query arsip | `src/features/arsip/services/arsipService.js`, `hooks/useArsip.js` |
| State URL dan tujuan kembali | `src/features/arsip/utils/listState.js` |
| Retensi/status | `src/features/arsip/utils/statusUtils.js` |
| View form | `src/features/arsip/components/ArsipForm.jsx` |
| State, validasi, penyimpanan, guard form | `src/features/arsip/hooks/useArchiveForm.js` |
| Combobox klasifikasi | `src/features/arsip/components/ClassificationPicker.jsx` |
| Normalisasi field dan URL dokumen | `src/features/arsip/utils/archiveFields.js` |
| Mutation arsip dan relasi label | `src/features/arsip/services/archiveMutations.js` |
| Token dan layout | `src/styles/theme.css`, `index.css`, `shell.css`, `dashboard.css`, `archive-form.css` |

Path tabel di atas relatif terhadap `sistem-arsip/`.
Ikuti [DESIGN.md](../DESIGN.md) untuk komponen baru dan
[struktur proyek](struktur-proyek.md) untuk batas modul.

## Kontrak alur form

1. Route memuat record edit bila diperlukan, menyaring tujuan kembali, lalu
   memasang form dengan key ID agar state antar-record tidak tercampur.
2. Form memiliki tiga field wajib: perihal, tanggal surat, klasifikasi. Nomor
   surat, pengirim, tujuan, tautan, dan label tetap opsional.
3. Metadata klasifikasi menentukan pilihan valid; keterlambatan metadata tidak
   mengunci field teks. Label mempunyai loading/error sendiri dan tidak
   menjadi syarat penyimpanan.
4. Mode kode otomatis mengikuti segmen pertama nomor sebelum `/`. Pengetikan
   atau pemilihan kode mengubah mode menjadi manual. Tombol saran mengembalikan
   mode otomatis. Jangan menimpa pilihan manual saat nomor berubah.
5. Dirty membandingkan tujuh nilai field dan himpunan ID label dengan baseline.
   Mencari label atau membuka pilihan tidak dianggap perubahan arsip.
6. Validasi dan normalisasi memakai helper bersama. Tanggal edit tidak valid
   harus dikoreksi; jangan menggantinya dengan hari ini secara diam-diam.
7. Mutation mengembalikan record dan kemungkinan error label. Simpan ID record
   sebelum menangani error label; retry harus memperbarui record yang sama.
8. Setelah server mengonfirmasi, invalidasi `['arsip']` dan `['labels']` dengan
   `refetchType: 'none'`. Data ditandai stale; route tujuan memuat ulang saat
   dipasang. Jangan menunggu daftar saran/label yang tidak menentukan hasil
   simpan untuk mengizinkan pengguna melanjutkan.
9. Guard rute/logout dan `beforeunload` melindungi perubahan. Jika pengguna
   meminta keluar selama simpan, tunggu hasil sebelum melanjutkan tujuan itu.

Form tidak menyimpan draft ke localStorage. Preferensi tema dapat tersimpan,
tetapi isi surat tidak ikut dipersistenkan di perangkat.

## Data dan performa

Pertahankan pagination server, jumlah hasil tepat, urutan stabil, dan pencarian
literal di layanan arsip. Filter/sort turunan tertentu memerlukan batch lengkap;
jangan mengganti dengan filter setelah mengambil satu halaman. Dashboard
memuat koleksi lengkap hanya saat rutenya dibuka. Query saran pengirim memakai
debounce 200 ms, minimal dua karakter, dan maksimal 10 hasil.

Filter periode laporan harus berlaku untuk seluruh ringkasan dan tabel. Ikuti
definisi pembanding di `dashboardData.js`; jangan mengarang perubahan persentase
saat pembanding tidak tersedia. Pertahankan pemeriksaan tanggal ketat.

XLSX dimuat saat diperlukan; route fitur dimuat terpisah. Hindari menambahkan
library grafik atau mengambil seluruh arsip untuk pencarian daftar biasa.
Ukur kebutuhan backend sebelum mengubah indeks, skema, RPC, atau kebijakan RLS;
pekerjaan UI ini tidak mencakup perubahan tersebut.

## Pengujian dan deployment

```sh
npm run check:structure
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run test:e2e:development
npm run build
```

Untuk regresi form saja: `npx playwright test tests/e2e/archive-form.spec.js`.
Jika Chromium sudah tersedia, set `PLAYWRIGHT_CHROMIUM_PATH` ke executable-nya.
`PLAYWRIGHT_OUTPUT_DIR` dapat mengubah direktori artefak. Default hasil browser
adalah `work/browser-results/`, yang tidak masuk Git.

Playwright menyalakan server lokal dengan konfigurasi fixture, mengintersep API,
dan tidak memakai database produksi. Tes auth dan mode development dijalankan
terpisah. GitHub Actions menjalankan struktur, lint, unit, build, dan kedua mode
browser; lihat `.github/workflows/`.

Pada Vercel gunakan Root Directory `sistem-arsip`, install `npm ci`, build
`npm run build`, output `dist`. `vercel.json` menangani fallback SPA. Aktifkan
auth secara eksplisit pada target yang memerlukan login, lalu verifikasi
refresh URL detail/edit. Live preview privat Sites memakai snapshot `dist`;
source pengembangan tetap repositori ini. Snapshot bukan lokasi mengedit fitur.

## Prioritas lanjutan

- Ukur waktu pencarian dan laporan dengan volume staging yang mewakili data
  nyata sebelum mengubah strategi query.
- Jika dibutuhkan transaksi arsip+label, rancang perubahan backend dan regresi
  hasil parsial terlebih dahulu; jangan menghapus penanganan retry lebih awal.
- Uji alur petugas dengan dokumen sebenarnya untuk menilai istilah, pilihan
  klasifikasi, dan kebutuhan pemulihan draft sebelum menambah langkah baru.

Untuk setiap perubahan, catat perilaku yang berubah, hasil tes yang dijalankan,
dan batas yang masih berlaku. Pertahankan referensi asli dan catatan versi
sebagai riwayat; perbarui dokumen acuan untuk keadaan aplikasi terkini.
