# SIMANTEP KRGT

Sistem Informasi Manajemen Arsip Terpadu untuk UPT Kebun Raya Gunung Tidar.
Aplikasi menggunakan React, Vite, Tailwind CSS, Supabase, dan React Query.

## Mulai mengembangkan

Gunakan Node.js 22.12+ dan npm.

```sh
cd sistem-arsip
npm ci
cp .env.example .env
# Isi konfigurasi lokal di .env.
npm run dev
```

Lihat [panduan aplikasi](sistem-arsip/README.md) untuk konfigurasi, perintah, dan deployment.

## Acuan desain dan pengembangan

- [DESIGN.md](DESIGN.md): sistem visual, UX, copywriting, dan interaksi terkini.
- [Panduan pengembangan](docs/pengembangan.md): peta modul, kontrak data/form, pengujian, dan deployment.
- [Audit form tambah/edit arsip](docs/audit-form-arsip.md): temuan, perbaikan, dan hasil verifikasi.
- [Indeks dokumentasi](docs/README.md): acuan aktif serta riwayat pengembangan.

Dokumen desain asli unggahan pengguna disimpan tanpa perubahan di
[docs/referensi/DESIGN-original.md](docs/referensi/DESIGN-original.md).

## Penataan repositori

```text
.github/workflows/     Pemeriksaan otomatis
 docs/                 Panduan arsitektur dan hasil audit
 sistem-arsip/          Root aplikasi dan konfigurasi Vite/Vercel
   scripts/            Pemeriksaan struktur dan utilitas inspeksi
   tests/              Regresi URL, query, pagination, dan status arsip
   src/
     app/              Komposisi aplikasi, routing, dan sesi
     assets/           Logo dan foto KRGT
     components/
       layout/         Kerangka aplikasi dan navigasi
       shared/         Komponen umum lintas fitur
       ui/             Komponen dasar dan varian tampilannya
     dev/              Bantuan HMR khusus development
     features/         arsip, auth, dashboard, klasifikasi, labels
     lib/              Klien integrasi dan helper umum
     styles/           Token desain dan CSS responsif
     main.jsx          Entry point dan providers
```

- [Perombakan dashboard SaaS — catatan sebelumnya](docs/perombakan-saas.md)
- [Aturan struktur dan alur data](docs/struktur-proyek.md)
- [Hasil audit struktur](docs/audit-struktur.md)
- [Perbaikan UI/UX tahap 1 dan panduan verifikasi](docs/ui-ux-tahap-1.md)
- [Sistem visual, layout responsif, dan pratinjau tahap 2](docs/ui-ux-tahap-2.md)

Direktori aplikasi tetap `sistem-arsip/`; pada Vercel gunakan direktori ini sebagai **Root Directory**.
