# Tasklist - GeoPatriot Web

Progress: 56%

Catatan: Layer non-UI (Phase 0, types, lib) dikerjakan oleh Claude Code.
Layer UI/Frontend (Phase 1, 2, dst.) dikerjakan oleh Antigravity.

## Phase 0 - Repository dan Baseline

- [✓] ✅ Task 0.1 - Bootstrap project Next.js + TypeScript + App Router + Tailwind `[Mudah]` (Selesai)
  - `pnpm create next-app` di subfolder sementara lalu dipindahkan ke root repo (nama folder asli mengandung spasi/kapital sehingga tidak bisa langsung dipakai npm package name)
  - File dibuat: `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `src/app/*`
- [✓] ✅ Task 0.2 - Struktur folder feature-oriented `[Mudah]` (Selesai)
  - Dibuat: `src/components/`, `src/features/{camera,location,metadata,watermark,sessions,downloads,settings}/`, `src/lib/{browser,image,providers,storage,downloads}/`, `src/types/`
- [✓] ✅ Task 0.3 - Tooling: pnpm, Vitest, Prettier, script package.json `[Mudah]` (Selesai)
  - Install `idb`, `fflate`, `vitest`, `fake-indexeddb`, `prettier`
  - Dibuat: `vitest.config.ts`, `vitest.setup.ts`, `.prettierrc.json`
  - Update `package.json` scripts: `typecheck`, `test`, `test:watch`, `format`
- [✓] ✅ Task 0.4 - Environment variables & dokumentasi `[Mudah]` (Selesai)
  - Dibuat: `.env.example` (NEXT_PUBLIC_LOCATIONIQ_API_KEY), `README.md` diperbarui

## Types - Kontrak Data (src/types/)

- [✓] ✅ Task T.1 - Domain types lokasi, metadata, watermark, session, provider, storage `[Sedang]` (Selesai)
  - File dibuat: `src/types/location.ts`, `metadata.ts`, `watermark.ts`, `session.ts`, `provider.ts`, `storage.ts`, `index.ts`

## lib/browser - Camera & Geolocation Wrapper

- [✓] ✅ Task B.1 - Wrapper getUserMedia (start/stop/switch camera, status eksplisit) `[Sedang]` (Selesai)
  - File dibuat: `src/lib/browser/camera.ts`, test: `camera.test.ts`
- [✓] ✅ Task B.2 - Wrapper Geolocation API + klasifikasi GPS quality `[Sedang]` (Selesai)
  - File dibuat: `src/lib/browser/geolocation.ts`, test: `geolocation.test.ts`

## lib/image - Watermark Engine

- [✓] ✅ Task I.1 - Layout logic murni (baris teks, format koordinat, clamp dimensi output) `[Sedang]` (Selesai)
  - File dibuat: `src/lib/image/watermark-layout.ts`, test: `watermark-layout.test.ts`
- [✓] ✅ Task I.2 - Watermark rendering engine berbasis Canvas (dependency-injected untuk testability) `[Sulit]` (Selesai)
  - File dibuat: `src/lib/image/watermark-engine.ts`, test: `watermark-engine.test.ts`
- [✓] ✅ Task I.3 - Template Default/Ringkas/Detail `[Mudah]` (Selesai)
  - File dibuat: `src/lib/image/templates/{default,ringkas,detail,index}.ts`

## lib/providers - LocationIQ & Abstraksi

- [✓] ✅ Task P.1 - LocationIqGeocodingProvider + LocationIqMapProvider `[Sedang]` (Selesai)
  - File dibuat: `src/lib/providers/locationiq-geocoding-provider.ts`, `locationiq-map-provider.ts`, test masing-masing
- [✓] ✅ Task P.2 - provider-factory sebagai satu-satunya entry point `[Mudah]` (Selesai)
  - File dibuat: `src/lib/providers/provider-factory.ts`

## lib/storage - IndexedDB Repository

- [✓] ✅ Task S.1 - Schema DB (idb) untuk sessions/photos/settings `[Sedang]` (Selesai)
  - File dibuat: `src/lib/storage/db.ts`, `storage-error.ts`
- [✓] ✅ Task S.2 - SessionRepository, PhotoRepository, SettingsRepository (CRUD + error handling) `[Sedang]` (Selesai)
  - File dibuat: `src/lib/storage/session-repository.ts`, `photo-repository.ts`, `settings-repository.ts` + test masing-masing (fake-indexeddb)

## lib/downloads - Download & ZIP Engine

- [✓] ✅ Task D.1 - Single download (Blob -> object URL -> anchor click) `[Mudah]` (Selesai)
  - File dibuat: `src/lib/downloads/single-download.ts`, test: `single-download.test.ts`
- [✓] ✅ Task D.2 - ZIP client-side via fflate `[Sedang]` (Selesai)
  - File dibuat: `src/lib/downloads/zip-download.ts`, test: `zip-download.test.ts`
- [✓] ✅ Task D.3 - Filename generator stabil & sortable `[Mudah]` (Selesai)
  - File dibuat: `src/lib/downloads/filename.ts`, test: `filename.test.ts`

## Phase 1 - App Shell dan Design System (UI/UX)

- [✓] ✅ Task 1.1 - Desain Sistem Modular & App Shell Mobile-First `[Sedang]` (Selesai)
  - Dibuat: `src/components/icons/index.tsx` (Ikon accessible SVG tanpa external package)
  - Dibuat: `src/components/ui/Button.tsx` (Varian primary, secondary, glass, shutter, icon dengan touch target 44px+)
  - Dibuat: `src/components/ui/StatusChip.tsx` (Chip status GPS berkualitas & mode waktu)
  - Dibuat: `src/components/ui/Card.tsx` (Dark glassmorphism surface)
  - Dibuat: `src/components/ui/BottomSheet.tsx` (Drawer bawah untuk progressive disclosure)
  - Dibuat: `src/components/ui/Dialog.tsx` (Modal konfirmasi accessible)
  - Dibuat: `src/components/ui/Toast.tsx` (Toast provider & hook notifikasi)
  - Dibuat: `src/components/ui/EmptyState.tsx` (Kondisi data kosong)
  - Dibuat: `src/components/ui/index.ts` (Barrel export UI)
  - Diperbarui: `src/app/globals.css` (Dark theme, overscroll-y none, touch tap highlight transparent)
  - Diperbarui: `src/app/layout.tsx` (Mobile viewport cover, tema gelap, metadata GeoPatriot, ToastProvider)
- [✓] ✅ Task 1.3 - Integrasi Palet Warna & Identitas Visual Kementerian Transmigrasi 2024 `[Sedang]` (Selesai)
  - Disalin: `public/app-icon.png` dan `public/logo-kementerian.webp` dari referensi
  - Diperbarui: `src/app/globals.css` (Mendaftarkan CSS variables Deep Navy `#08111d`/`#0e2035`, Golden Ochre `#c5984f`, Muted Teal `#2f6d8b`)
  - Diperbarui: `src/app/layout.tsx` (Metadata title dan icon kementerian, themeColor `#08111d`)
  - Diperbarui: `src/components/ui/Button.tsx` (Varian primary Warm Gold `#c5984f`, secondary Deep Navy, glassmorphism)
  - Diperbarui: `src/components/ui/StatusChip.tsx` (Pewarnaan Muted Teal dan Warm Gold yang serasi)
  - Diperbarui: `src/components/ui/Card.tsx` & `BottomSheet.tsx` (Gaya Deep Navy Glassmorphism)
  - Diperbarui: `src/features/camera/camera-screen.tsx` (Header menampilkan logo resmi `app-icon.png` dan label "Kementerian Transmigrasi RI")
  - Diperbarui: `src/features/camera/camera-permission-fallback.tsx` (Welcome screen menampilkan emblem logo resmi dengan glow hangat)

## Phase 2 - Camera Proof of Concept & Viewfinder

- [✓] ✅ Task 2.1 - Implementasi Kamera Viewport & Kontrol Shutter `[Sedang]` (Selesai)
  - Dibuat: `src/features/camera/use-camera.ts` (Hook pengelola stream getUserMedia, lifecycle, dan switch camera)
  - Dibuat: `src/features/camera/camera-viewport.tsx` (Video viewport, front-camera mirroring, shutter flash effect)
  - Dibuat: `src/features/camera/camera-permission-fallback.tsx` (Panduan izin kamera edukatif untuk idle, requesting, denied, unsupported)
  - Dibuat: `src/features/camera/camera-controls.tsx` (Kontrol bawah di zona ibu jari: shutter button, flip camera, shortcut galeri)
  - Dibuat: `src/features/camera/camera-screen.tsx` (Layar utama kamera menyatukan top bar branding, status chip, viewport, dan controls)
  - Dibuat: `src/features/camera/index.ts` (Barrel export fitur camera)
  - Diperbarui: `src/app/page.tsx` (Merender CameraScreen)
- [✓] ✅ Task 2.2 - Perbaikan Hydration Mismatch & Solusi HTTPS Jaringan Lokal `[Mudah]` (Selesai)
  - Diperbarui: `src/app/layout.tsx` (`suppressHydrationWarning` pada html & body)
  - Diperbarui: `src/app/page.tsx` (`ssr: false` client-only dynamic loading untuk meniadakan konflik ekstensi browser)
  - Diperbarui: `package.json` (Menambahkan script `dev:https` dengan Next.js `--experimental-https`)
  - Diperbarui: `src/lib/browser/camera.ts` (Fungsi `isSecureContext()` & deteksi insecure context)
  - Diperbarui: `src/features/camera/camera-permission-fallback.tsx` (Panduan edukatif solusi akses via HTTPS di HP)
- [✓] ✅ Task 2.3 - Konfigurasi allowedDevOrigins di next.config.ts `[Mudah]` (Selesai)
  - Diperbarui: `next.config.ts` (Menambahkan `allowedDevOrigins` yang mengizinkan `192.168.100.10` dan auto-detect IPv4 dari `os.networkInterfaces()` agar chunk JS dan websocket HMR tidak terblokir cross-origin di HP)

## Verifikasi Baseline & Build

- [✓] ✅ Task V.1 - Smoke test end-to-end lintas layer (session -> photo -> watermark -> zip) `[Sedang]` (Selesai)
  - File dibuat: `src/lib/integration.smoke.test.ts`
- [✓] ✅ Task V.2 - `pnpm typecheck`, `pnpm lint`, `pnpm test` seluruhnya lulus `[Mudah]` (Selesai)
  - 39/39 unit test lulus, 0 error TypeScript, 0 error ESLint
- [✓] ✅ Task V.3 - `pnpm build` lulus tanpa error Turbopack Next.js 16 `[Mudah]` (Selesai)

## Belum Dikerjakan (Next Steps)

- [ ] Task 3.1 & 4.1 - Phase 3 & 4: Geolocation Integration & Metadata Editor (`src/features/location/`, `src/features/metadata/`)
- [ ] Task 5.1 & 6.1 - Phase 5 & 6: Capture Pipeline & Watermark Live HUD/Rendering (`src/features/watermark/`, wiring ke `src/lib/image/watermark-engine.ts`)
- [ ] Task 9.1 & 10.1 - Phase 9 & 10: Multi-Photo Session & Session Gallery Drawer (`src/features/sessions/`)
- [ ] Task 11.1 - Phase 11: Single & Batch ZIP Download Trigger (`src/features/downloads/`)
- [ ] Task 12.1 - Phase 12: PWA Manifest & Service Worker
- [ ] Task 13.1 - Phase 13: Settings Sheet & Storage Indicator

## Ringkasan Checkpoint Saat Ini

Identitas visual resmi Kementerian Transmigrasi 2024 (Deep Navy, Golden Ochre, Muted Teal) telah selesai diintegrasikan secara menyeluruh pada aset, token CSS, komponen UI, top header, dan layar sambutan kamera.
Aplikasi kini tampil sangat kredibel dan berkarakter dinas resmi, bebas error build, typecheck, dan lint.
Selanjutnya siap melanjutkan ke **Phase 3 (Geolocation GPS Integration)** dan **Phase 4 (Metadata Editor Sheet)**.
