# GeoPatriot Web

Versi web dari GeoPatriot: GPS camera dengan watermark lokasi & waktu, **local-first**
(kamera, GPS, pemrosesan foto, dan storage berjalan di browser pengguna, tanpa backend).

Dokumen produk lengkap ada di `agents/`:

- `agents/prd-geopatriot-web.md` — requirement produk
- `agents/rules-geopatriot-web.md` — aturan wajib untuk implementasi
- `agents/workflow-geopatriot-web.md` — urutan pengerjaan per fase
- `agents/tasklist.md` — progress pengerjaan (update setiap task selesai)

## Fitur Utama

- **Kamera & Viewfinder Mobile-First**: Antarmuka responsif ramah ibu jari, live view, switch kamera depan/belakang, serta shutter flash instan.
- **Camera Zoom Tingkat Lanjut**: Deteksi kapabilitas hardware W3C, pinch-to-zoom dua jari native dengan `touch-action: none`, dan tombol preset praktis (`1×`, `2×`, dll.) dengan graceful fallback.
- **GPS & Geocoding Cerdas**: Pelacakan akurasi sinyal live, reverse geocoding via LocationIQ, serta auto-fallback ke Mode Manual tanpa memblokir alur kerja lapangan.
- **Watermark Engine Berbasis Canvas**: Overlay watermark resmi dengan 3 pilihan template (`Default`, `Ringkas`, `Detail`), posisi atas/bawah, slider opasitas latar, dan toggle visibilitas 8 metadata.
- **Manajemen Sesi & Galeri Foto**: Penyimpanan lokal aman di IndexedDB, navigasi galeri multi-kolom, pratinjau foto resolusi penuh, pemilihan banyak foto (multi-select), dan unduh ZIP client-side instan (`fflate`).
- **Progressive Web App (PWA)**: Web manifest mandiri (standalone), service worker cache offline, serta banner deteksi koneksi lapangan.
- **Pengaturan & Indikator Penyimpanan**: Estimasi memori live (`navigator.storage.estimate()`), pembersihan aman foto terunduh (Rules #10.5), dan reset data aman.
- **Diagnostik Kesehatan Sistem**: Pemantauan 6 subsistem eksplisit (`camera`, `zoom`, `gps`, `geocoding`, `map`, `storage`), banner peringatan kuota proaktif, serta panduan izin browser untuk iOS Safari & Android Chrome.

## Menjalankan Proyek

```bash
pnpm install
pnpm dev            # Jalankan dev server HTTP lokal (http://localhost:3000)
pnpm dev:https      # Jalankan dev server HTTPS untuk pengujian kamera/GPS di HP
pnpm typecheck      # Verifikasi TypeScript (strict mode, tsc --noEmit)
pnpm lint           # Audit kode ESLint
pnpm test           # Menjalankan 83 unit & integration test Vitest
pnpm build          # Kompilasi produksi Next.js 16 Turbopack
```

## Struktur Folder

```text
src/
  app/              App Router Next.js (layout, page, globals.css, manifest)
  components/       Komponen UI dasar (Button, BottomSheet, Dialog, Toast, Icons, Card, dsb.)
  features/
    camera/         Viewport kamera, controls, zoom, permission fallback, capture pipeline
    location/       Hook geolocation, GPS quality chip, provider geocoding
    metadata/       Metadata editor sheet, konfigurasi mode manual/waktu, buildSnapshot
    watermark/      Pengaturan visual template watermark
    sessions/       Drawer galeri sesi, multi-photo grid, card pratinjau
    downloads/      Download manager, ZIP batch generator, dialog progres unduh
    settings/       Settings sheet, manajemen preferensi, meteran penyimpanan IndexedDB
    diagnostics/    Evaluator status eksplisit 6 subsistem, banner peringatan, modal diagnostik
    pwa/            Hook PWA, banner offline / ajakan install
  lib/
    browser/        Wrapper getUserMedia, kamera zoom, dan Geolocation API
    image/          Watermark canvas rendering engine, templates layout
    providers/      LocationIQ provider + provider factory
    storage/        Repository IndexedDB (photos, sessions, settings)
    downloads/      Single download, fflate ZIP compression, generator nama berkas
  types/            Kontrak data domain (metadata, location, watermark, session, diagnostics)
```

## Environment Variables

Lihat `.env.example`. `NEXT_PUBLIC_LOCATIONIQ_API_KEY` dikirim ke client bundle dan
**bukan credential rahasia** — lihat `agents/rules-geopatriot-web.md` #12.4 dan #17.4-17.5
sebelum deploy publik dalam skala besar.

## Prinsip Non-Negotiable

Core capture (kamera + GPS + watermark + simpan lokal) harus tetap berjalan walau
LocationIQ down, offline, atau GPS buruk/ditolak. Lihat
`agents/rules-geopatriot-web.md` #24.
