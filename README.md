# GeoPatriot Web

Versi web dari GeoPatriot: GPS camera dengan watermark lokasi & waktu, **local-first**
(kamera, GPS, pemrosesan foto, dan storage berjalan di browser pengguna, tanpa backend).

Dokumen produk lengkap ada di `agents/`:

- `agents/prd-geopatriot-web.md` — requirement produk
- `agents/rules-geopatriot-web.md` — aturan wajib untuk implementasi
- `agents/workflow-geopatriot-web.md` — urutan pengerjaan per fase
- `agents/tasklist.md` — progress pengerjaan (update setiap task selesai)

## Status Saat Ini

Sesi ini menyelesaikan seluruh **layer non-UI**: `types/`, `lib/browser` (camera & geolocation
wrapper), `lib/image` (watermark engine berbasis Canvas), `lib/providers` (LocationIQ +
abstraksi geocoding/map), `lib/storage` (repository IndexedDB), dan `lib/downloads`
(single download & ZIP client-side via fflate).

**Komponen UI/halaman (`app/`, `components/`, isi `features/*`) belum dikerjakan** —
itu akan dikerjakan terpisah menggunakan Antigravity. UI cukup memanggil fungsi yang
sudah tersedia di `src/lib/*` dan `src/types/*`; jangan mengakses IndexedDB atau
LocationIQ secara langsung dari komponen (lihat `agents/rules-geopatriot-web.md` #2.4-2.5).

## Menjalankan Proyek

```bash
pnpm install
pnpm dev          # jalankan dev server (http://localhost:3000)
pnpm typecheck    # tsc --noEmit, strict mode
pnpm lint         # ESLint
pnpm test         # Vitest, unit test untuk src/lib dan src/types
pnpm format       # Prettier --write
```

## Struktur Folder

```text
src/
  app/                 shell Next.js default — belum dikembangkan (Antigravity)
  components/           placeholder — belum dikembangkan (Antigravity)
  features/
    camera/ location/ metadata/ watermark/
    sessions/ downloads/ settings/   placeholder — belum dikembangkan (Antigravity)
  lib/
    browser/            wrapper getUserMedia() & Geolocation API
    image/               watermark engine (Canvas) + templates (default/ringkas/detail)
    providers/           implementasi LocationIQ + provider-factory (entry point tunggal)
    storage/              repository IndexedDB (session/photo/settings)
    downloads/            single download, ZIP client-side (fflate), filename generator
  types/                 kontrak data seluruh sistem
```

## Environment Variables

Lihat `.env.example`. `NEXT_PUBLIC_LOCATIONIQ_API_KEY` dikirim ke client bundle dan
**bukan credential rahasia** — lihat `agents/rules-geopatriot-web.md` #12.4 dan #17.4-17.5
sebelum deploy publik dalam skala besar.

## Prinsip Non-Negotiable

Core capture (kamera + GPS + watermark + simpan lokal) harus tetap berjalan walau
LocationIQ down, offline, atau GPS buruk/ditolak. Lihat
`agents/rules-geopatriot-web.md` #24.
