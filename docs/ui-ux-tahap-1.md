# UI/UX tahap 1: alur inti arsip

Tahap ini memperbaiki navigasi dan ketepatan hasil daftar sebelum perubahan visual.

## Perilaku pengguna

- Kartu dashboard membuka `/arsip`, `/arsip?status=active`, atau `/arsip?status=inactive`.
- Pencarian mencakup nomor surat, perihal, dan pengirim. Karakter tanda baca serta
  `%`, `_`, dan `*` diperlakukan sebagai teks literal.
- Filter tanggal surat mencakup satu hari penuh. Filter status, klasifikasi, label,
  tanggal, dan pencarian dapat digunakan bersamaan.
- Filter label mempertahankan label lain pada arsip yang sama.
- Kolom tabel mengurutkan nilai sebenarnya; status mengikuti aturan retensi yang
  sudah ada, termasuk arsip permanen dengan retensi aktif/inaktif sama-sama nol.
- Footer memakai jumlah seluruh hasil yang cocok. Perubahan pencarian, filter,
  sorting, atau ukuran halaman mengembalikan halaman ke 1 dalam satu perubahan URL.
- Halaman di luar jumlah hasil diarahkan ke halaman terakhir yang tersedia.
- Detail `/arsip/:id` membaca arsip berdasarkan ID, termasuk label terkait.
  Refresh dan tautan langsung tidak lagi bergantung pada pilihan di memori.
- Parameter `from` pada tautan detail memulihkan URL daftar saat tombol kembali
  digunakan. Nilainya dibatasi ke `/arsip` atau `/semua-arsip`.
- Kondisi gagal memuat menyediakan tombol coba lagi; ID yang tidak ditemukan
  menyediakan jalan kembali ke daftar. URL lama `/arsip/detail` kembali ke daftar.
- Daftar/detail mengelola loading sendiri sehingga kegagalan atau lamanya query
  koleksi dashboard tidak menghalangi pembukaan detail langsung. Dashboard juga
  menyediakan kondisi error dan retry.
- Command palette mencari field nomor surat yang benar dan menuju detail ID.
  Tombol panah/Enter tetap aman saat hasil kosong.

## State URL

| Parameter | Contoh |
| --- | --- |
| `q` | `q=sekolah` |
| `status` | `active`, `inactive` |
| `klasifikasi` | `005` |
| `label` | ID label |
| `date` | `2026-10-09` |
| `sort` | `tanggalSurat`, `nomorSurat`, `perihal`, `kodeKlasifikasi`, `created_at`, `status`, `label` |
| `order` | `asc`, `desc` |
| `page` | Bilangan positif |
| `pageSize` | `10`, `20`, `50`, `100` |
| `view` | `table`, `grid` |

Nilai default dihilangkan dari URL saat pengguna mengubah kontrol. Nilai tidak valid
menggunakan default aman. Filter dan posisi halaman tetap tersedia setelah refresh.

## Query dan cache

`features/arsip/services/arsipService.js` membangun query Supabase; `useArsip`
mengelola cache dan pagination; `utils/listState.js` menangani state URL.

Sorting kolom fisik tanpa filter status memakai pagination server dan count tepat.
Filter status serta sorting status/label membaca seluruh hasil yang cocok melalui
batch sebelum filtering/sorting dan pagination. Status berasal dari retensi dan
klasifikasi; nama label berasal dari relasi, sehingga keduanya tidak dapat diurutkan
sebagai kolom langsung dengan skema saat ini. Hasil lengkap dicache dengan key yang
tidak bergantung pada halaman atau ukuran halaman. Perubahan klasifikasi retensi
dan hari masuk ke key query yang memerlukan status.

Dashboard dan command palette memakai koleksi lengkap yang juga dibaca melalui batch,
sehingga tidak berhenti pada batas default API. Subscription realtime menginvalidasi
query arsip, klasifikasi, label, dan perubahan assignment label terkait.
Setter koleksi store mendukung pembaruan melalui fungsi agar event realtime
tidak mengganti array data dengan objek fungsi dan menyebabkan halaman kosong.

Pendekatan koleksi lengkap membutuhkan bandwidth/memori sebanding jumlah hasil.
Jika volume membesar, gunakan view/RPC agregasi dan sorting di database dalam tahap
tersendiri setelah skema, kebijakan RLS, serta aturan zona waktu disepakati.
Tahap ini tidak mengubah skema database atau aturan retensi.

## Verifikasi

```sh
cd sistem-arsip
npm run check:structure
npm run lint
npm test
npm run build
```

Tes Node memakai query builder Supabase asli dengan fetch dan respons contoh;
tidak memakai kredensial atau database produksi. Cakupannya mencakup count/range,
tie-breaker sorting, komposisi filter, pencarian literal, koleksi lebih dari 1.000
baris dengan batas API lebih kecil, status permanen, sorting turunan, query detail,
error database termasuk range HTTP 416, cancellation signal, state URL, dan
pembaruan koleksi store melalui event realtime.

Pemeriksaan browser menggunakan fixture terisolasi untuk dashboard, pagination,
filter gabungan, pencarian, sorting, cache, detail, refresh/kembali, command palette,
serta error/retry. Verifikasi browser tersebut tidak menguji RLS atau isi database
produksi. Ulangi smoke test dengan akun pengguna pada deployment:

1. Klik tiga kartu dashboard dan cocokkan status serta jumlah hasil.
2. Cari pengirim, gabungkan filter, pindah halaman, ubah jumlah baris, lalu refresh.
3. Urutkan label dan status, buka detail dari halaman 2, refresh, lalu kembali.
4. Buka tautan detail langsung serta ID tidak ditemukan dan periksa pemulihannya.
5. Gunakan Ctrl/Cmd+K untuk mencari nomor surat; coba navigasi saat hasil kosong.

Perubahan layout responsif, desain visual, komponen aksesibilitas umum, form/impor,
dan cakupan ekspor tetap mengikuti tahap berikutnya dalam rencana UI/UX.
