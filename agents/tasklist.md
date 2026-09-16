# Tasklist - GeoPatriot Web

Progress: 30%

Catatan: seluruh task pada file ini berada dalam lingkup "sebelum frontend" —
yaitu Phase 0 (bootstrap) dan seluruh `lib/`+`types/` non-UI. Pekerjaan UI/halaman
(`app/`, `components/`, isi `features/*`) sengaja TIDAK termasuk di sini karena
akan dikerjakan terpisah menggunakan Antigravity.

## Phase 0 - Repository dan Baseline

- [✓] ✅ Task 0.1 - Bootstrap project Next.js + TypeScript + App Router + Tailwind `[Mudah]` (Selesai)
  * `pnpm create next-app` di subfolder sementara lalu dipindahkan ke root repo (nama folder asli mengandung spasi/kapital sehingga tidak bisa langsung dipakai npm package name)
  * File dibuat: `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `src/app/*`
- [✓] ✅ Task 0.2 - Struktur folder feature-oriented `[Mudah]` (Selesai)
  * Dibuat: `src/components/`, `src/features/{camera,location,metadata,watermark,sessions,downloads,settings}/` (placeholder `.gitkeep`, milik Antigravity), `src/lib/{browser,image,providers,storage,downloads}/`, `src/types/`
- [✓] ✅ Task 0.3 - Tooling: pnpm, Vitest, Prettier, script package.json `[Mudah]` (Selesai)
  * Install `idb`, `fflate`, `vitest`, `fake-indexeddb`, `prettier`
  * Dibuat: `vitest.config.ts`, `vitest.setup.ts`, `.prettierrc.json`
  * Update `package.json` scripts: `typecheck`, `test`, `test:watch`, `format`
- [✓] ✅ Task 0.4 - Environment variables & dokumentasi `[Mudah]` (Selesai)
  * Dibuat: `.env.example` (NEXT_PUBLIC_LOCATIONIQ_API_KEY), `README.md` diperbarui

## Types - Kontrak Data (src/types/)

- [✓] ✅ Task T.1 - Domain types lokasi, metadata, watermark, session, provider, storage `[Sedang]` (Selesai)
  * File dibuat: `src/types/location.ts`, `metadata.ts`, `watermark.ts`, `session.ts`, `provider.ts`, `storage.ts`, `index.ts`

## lib/browser - Camera & Geolocation Wrapper

- [✓] ✅ Task B.1 - Wrapper getUserMedia (start/stop/switch camera, status eksplisit) `[Sedang]` (Selesai)
  * File dibuat: `src/lib/browser/camera.ts`, test: `camera.test.ts`
- [✓] ✅ Task B.2 - Wrapper Geolocation API + klasifikasi GPS quality `[Sedang]` (Selesai)
  * File dibuat: `src/lib/browser/geolocation.ts`, test: `geolocation.test.ts`

## lib/image - Watermark Engine

- [✓] ✅ Task I.1 - Layout logic murni (baris teks, format koordinat, clamp dimensi output) `[Sedang]` (Selesai)
  * File dibuat: `src/lib/image/watermark-layout.ts`, test: `watermark-layout.test.ts`
- [✓] ✅ Task I.2 - Watermark rendering engine berbasis Canvas (dependency-injected untuk testability) `[Sulit]` (Selesai)
  * File dibuat: `src/lib/image/watermark-engine.ts`, test: `watermark-engine.test.ts`
- [✓] ✅ Task I.3 - Template Default/Ringkas/Detail `[Mudah]` (Selesai)
  * File dibuat: `src/lib/image/templates/{default,ringkas,detail,index}.ts`

## lib/providers - LocationIQ & Abstraksi

- [✓] ✅ Task P.1 - LocationIqGeocodingProvider + LocationIqMapProvider `[Sedang]` (Selesai)
  * File dibuat: `src/lib/providers/locationiq-geocoding-provider.ts`, `locationiq-map-provider.ts`, test masing-masing
- [✓] ✅ Task P.2 - provider-factory sebagai satu-satunya entry point `[Mudah]` (Selesai)
  * File dibuat: `src/lib/providers/provider-factory.ts`

## lib/storage - IndexedDB Repository

- [✓] ✅ Task S.1 - Schema DB (idb) untuk sessions/photos/settings `[Sedang]` (Selesai)
  * File dibuat: `src/lib/storage/db.ts`, `storage-error.ts`
- [✓] ✅ Task S.2 - SessionRepository, PhotoRepository, SettingsRepository (CRUD + error handling) `[Sedang]` (Selesai)
  * File dibuat: `src/lib/storage/session-repository.ts`, `photo-repository.ts`, `settings-repository.ts` + test masing-masing (fake-indexeddb)

## lib/downloads - Download & ZIP Engine

- [✓] ✅ Task D.1 - Single download (Blob -> object URL -> anchor click) `[Mudah]` (Selesai)
  * File dibuat: `src/lib/downloads/single-download.ts`, test: `single-download.test.ts`
- [✓] ✅ Task D.2 - ZIP client-side via fflate `[Sedang]` (Selesai)
  * File dibuat: `src/lib/downloads/zip-download.ts`, test: `zip-download.test.ts`
- [✓] ✅ Task D.3 - Filename generator stabil & sortable `[Mudah]` (Selesai)
  * File dibuat: `src/lib/downloads/filename.ts`, test: `filename.test.ts`

## Verifikasi

- [✓] ✅ Task V.1 - Smoke test end-to-end lintas layer (session -> photo -> watermark -> zip) `[Sedang]` (Selesai)
  * File dibuat: `src/lib/integration.smoke.test.ts`
- [✓] ✅ Task V.2 - `pnpm typecheck`, `pnpm lint`, `pnpm test` seluruhnya lulus `[Mudah]` (Selesai)
  * 39/39 test lulus, 0 error TypeScript, 0 error ESLint

## Belum Dikerjakan (Next Steps)

- [ ] Task F.1 - Halaman & komponen UI (`app/`, `components/`, isi `features/*`) — **diserahkan ke Antigravity**
- [ ] Task F.2 - PWA (manifest + service worker) — sebaiknya bersamaan dengan UI kecuali diminta lain
- [ ] Task F.3 - Wiring React state/hooks ke `lib/*` yang sudah tersedia
- [ ] Task F.4 - Testing manual di Android Chrome, iPhone Safari, desktop (workflow #17-#18)
- [ ] Task F.5 - Connect repo ke Vercel untuk preview/production deployment (manual oleh user, PRD #21)

## Ringkasan Agent Berikutnya

Semua layer non-UI (types, browser wrapper, watermark engine, provider, storage,
downloads) sudah lengkap, typed strict, dan diuji (39 unit test lulus). Repo sudah
di-`git init` dengan commit baseline. Agent berikutnya (atau Antigravity) tinggal:
1. Baca `agents/prd-geopatriot-web.md`, `rules-geopatriot-web.md`, `workflow-geopatriot-web.md`.
2. Import fungsi dari `src/lib/*` dan tipe dari `src/types/*` — jangan bikin ulang logic yang sudah ada.
3. Mulai dari Phase 1 (App Shell & Design System) di `agents/workflow-geopatriot-web.md`.
