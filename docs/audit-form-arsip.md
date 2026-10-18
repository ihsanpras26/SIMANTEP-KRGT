# Audit dan perbaikan form arsip

Tanggal: 18 Oktober 2026. Lingkup: `/arsip/tambah` dan `/arsip/:id/edit`, yang
memakai form bersama. Tidak ada perubahan skema, indeks, RLS, atau layanan
query arsip inti pada pekerjaan ini.

## Temuan dan hasil

| Temuan sebelum perbaikan | Perilaku setelah perbaikan |
| --- | --- |
| Pemuatan/gagal label opsional menahan seluruh form | State metadata dipisahkan; pengguna tetap dapat mengisi dan menyimpan tanpa menunggu label |
| Kode otomatis tertahan pada prefiks pertama | Kode mengikuti nomor sampai dipilih manual; saran dapat diterapkan lagi secara eksplisit |
| Pilihan kode sulit ditemukan lewat deskripsi | Combobox kode/deskripsi, hasil kosong, keyboard, dan sentuhan |
| Peringatan keluar tetap muncul setelah nilai dipulihkan | Perubahan dihitung dari nilai aktual dan himpunan label terhadap baseline |
| Validasi baru muncul saat submit; kesalahan sulit dijangkau | Validasi saat blur, koreksi setelah error, ringkasan dengan aksi fokus, dan nomor duplikat ditandai langsung |
| Simpan menunggu refetch label/saran lain | Cache ditandai stale tanpa menunggu refetch yang tidak menentukan hasil penyimpanan |
| Tanggal edit yang tidak valid diam-diam menjadi hari ini | Tanggal edit tetap kosong dan wajib diperbaiki; arsip baru masih memakai tanggal hari ini dengan petunjuk |
| Form panjang memberi sedikit petunjuk status | Kelompok field berurutan, penanda opsional, indikator tiga field wajib, serta bar simpan dan status |

Form tetap satu halaman agar petugas dapat memeriksa surat secara utuh.
Pengirim, tujuan, dokumen, dan label tidak disembunyikan di wizard. Layout
menyesuaikan ponsel; input 16 px dan label satu kolom pada layar paling sempit.

## Interaksi yang dipertahankan

- Klik simpan berulang tidak mengirim mutation ganda selama request berjalan.
- Gagal simpan mempertahankan isian; pesan utama sederhana, detail teknis
  tersedia bila diperlukan.
- Arsip dan label disimpan melalui request terpisah. Jika hanya label gagal,
  ID arsip yang berhasil disimpan dipakai kembali saat mencoba ulang.
- Navigasi rute, logout, dan penutupan tab memperingatkan perubahan yang belum
  disimpan. Dialog tidak mengizinkan keluar saat penyimpanan masih berjalan.
- Tujuan kembali membawa filter daftar atau periode laporan yang sah.
- Edit tidak membuang referensi file lama ketika pengguna tidak menggantinya.
- Light sebagai bawaan dan preferensi dark tetap berlaku.

## Bukti pengujian

Regresi perilaku utama terlebih dahulu dijalankan terhadap form lama dan
gagal pada kasus yang dituju, kemudian lulus setelah perbaikan. Verifikasi
otomatis menggunakan fixture lokal dan tidak menulis database produksi.

| Cakupan | Lokasi | Hasil verifikasi |
| --- | --- | --- |
| Normalisasi, tanggal, retensi, query, statistik, impor, URL, auth | `sistem-arsip/tests/*.test.js` | 62 unit test lulus |
| Alur aplikasi dengan auth aktif, termasuk 10 skenario form awal | `sistem-arsip/tests/e2e` | 39 lulus; 1 tes khusus development dilewati sesuai konfigurasi |
| Akses development tanpa login | `tests/e2e/development.spec.js` | 1 lulus pada konfigurasi terpisah |
| Sentuhan pada hasil klasifikasi dan screenshot responsif terbaru | `tests/e2e/archive-form.spec.js` | 3 lulus pada uji terarah setelah penyesuaian layout kecil |

Skenario form mencakup kode otomatis/manual, keyboard, pemulihan nilai,
label gagal dimuat, metadata lambat, validasi dan fokus, nomor duplikat,
tanggal edit tidak valid, serta simpan yang tidak menunggu refetch label.
Regresi aplikasi lain mencakup gagal label parsial, coba ulang, navigasi dan
logout selama proses penyimpanan. Screenshot light/dark dihasilkan pada
320 dan 1.440 px. Pemeriksaan kode dilakukan mandiri bersama tes otomatis;
hasil ini bukan review independen atau pengujian menyeluruh pada semua perangkat.

Pemeriksaan akhir struktur (74 sumber/aset terjangkau), ESLint, 62 unit test,
dan build produksi dengan login aktif juga lulus. Setelah suite browser lengkap,
perubahan produk terakhir hanya merapikan label menjadi satu kolom pada lebar
di bawah 400 px; tes responsif diulang bersama tes sentuhan tambahan.

## Batas yang relevan bagi pengembangan berikutnya

Penyimpanan arsip dan relasi label belum atomik. Pertahankan pesan hasil parsial
dan identitas record sampai tersedia perubahan backend yang memang mencakup
transaksi. Pemeriksaan nomor duplikat di klien tidak menjamin penulisan
bersamaan tanpa constraint database yang sesuai.

Draft berada di memori halaman; tidak ada autosave atau pemulihan setelah tab
ditutup. Validasi URL memeriksa format/protokol, bukan akses dokumen. Fixture
membuktikan alur klien; izin tabel, latensi produksi, dan operasi dengan data
nyata tetap perlu diuji pada lingkungan staging yang sesuai.
