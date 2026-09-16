# Tasklist - GeoPatriot Web

Progress: 97%

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
- [✓] ✅ Task 1.3 - Integrasi Palet Warna Deep Navy & Golden Ochre serta Identitas Visual GeoPatriot `[Sedang]` (Selesai)
  - Disalin: `public/app-icon.png` (Logo resmi aplikasi: GPS pin + aperture)
  - Diperbarui: `src/app/globals.css` (Mendaftarkan CSS variables Deep Navy `#08111d`/`#0e2035`, Golden Ochre `#c5984f`, Muted Teal `#2f6d8b`)
  - Diperbarui: `src/app/layout.tsx` (Metadata title "GeoPatriot Web", icon `app-icon.png`, themeColor `#08111d`)
  - Diperbarui: `src/components/ui/Button.tsx` (Varian primary Warm Gold `#c5984f`, secondary Deep Navy, glassmorphism)
  - Diperbarui: `src/components/ui/StatusChip.tsx` (Pewarnaan Muted Teal dan Warm Gold yang serasi)
  - Diperbarui: `src/components/ui/Card.tsx` & `BottomSheet.tsx` (Gaya Deep Navy Glassmorphism)
  - Diperbarui: `src/features/camera/camera-screen.tsx` (Header menampilkan logo resmi `app-icon.png` dan judul "GeoPatriot" / "GPS Camera")
  - Diperbarui: `src/features/camera/camera-permission-fallback.tsx` (Layar sambutan menampilkan emblem logo resmi GeoPatriot dengan glow hangat)

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
- [✓] ✅ Task 2.4 - Native Camera Zoom & Multi-Modal Control (Pinch & Presets) `[Sedang]` (Selesai)
  - Dibuat/Diperbarui: `src/lib/browser/camera.ts` (Interface `ZoomCapabilities`, fungsi `getCameraZoomCapabilities`, `getCameraCurrentZoom`, `applyCameraZoom` berbasis W3C advanced constraints, dan generator adaptif `calculateZoomPresets`)
  - Dibuat/Diperbarui: `src/lib/browser/camera.test.ts` (5 unit tests untuk deteksi kapabilitas zoom, pembacaan tingkat zoom, kalkulasi preset, dan aplikasi zoom constraint)
  - Diperbarui: `src/features/camera/use-camera.ts` (Auto-sync `zoomCapabilities`, auto-clamping batas min-max & step rounding, penanganan graceful fallback ke 1× saat switch camera)
  - Diperbarui: `src/features/camera/camera-viewport.tsx` (Pencegahan page zoom via `touch-none`, deteksi gestur dua jari pinch-to-zoom dengan perhitungan jarak sentuh proporsional)
  - Diperbarui: `src/features/camera/camera-controls.tsx` (Bilah pill preset zoom adaptif di Thumb Zone atas tombol shutter: 1×, 2×, dsb. beserta live bubble indicator)
  - Diperbarui: `src/types/metadata.ts` (Properti `zoom?: number` pada `MetadataSnapshot`)
  - Diperbarui: `src/features/metadata/use-metadata-config.ts` (Menyimpan tingkat zoom aktif pada `MetadataSnapshot` yang dibekukan saat shutter ditekan)
  - Diperbarui: `src/features/metadata/metadata-config.test.ts` (Unit test pembekuan nilai zoom pada snapshot)
  - Diperbarui: `src/features/camera/camera-screen.tsx` (Wiring interaksi zoom dari hook `useCamera` ke viewport, controls, dan capture pipeline)

## Phase 3 - Geolocation Integration

- [✓] ✅ Task 3.1 - Wrapper continuous watch & Hook Geolocation `[Sedang]` (Selesai)
  - Dibuat: `src/features/location/use-geolocation.ts` (Hook status GPS, akurasi, kualitas, reverse geocoding otomatis via LocationIQ)
  - Dibuat: `src/features/location/index.ts` (Barrel export fitur location)
  - Diperbarui: `src/lib/browser/geolocation.ts` (Menambahkan `watchPosition` continuous listener dengan auto cleanup)
  - Diperbarui: `src/lib/browser/geolocation.test.ts` (Unit tests untuk `watchPosition`)
  - Diperbarui: `src/components/ui/StatusChip.tsx` (Mendukung `React.HTMLAttributes` pada `GpsQualityChip` & `TimeModeChip`)

## Phase 4 - Metadata Editor & Snapshot Generator

- [✓] ✅ Task 4.1 - Konfigurasi Sumber Metadata & Drawer Editor Sheet `[Sedang]` (Selesai)
  - Dibuat: `src/features/metadata/use-metadata-config.ts` (State manager mode GPS vs Manual, waktu Auto vs Manual, dan snapshot generator murni `buildMetadataSnapshot`)
  - Dibuat: `src/features/metadata/metadata-editor-sheet.tsx` (BottomSheet drawer mobile-first untuk input koordinat, nama lokasi, alamat, waktu manual, dan catatan lapangan)
  - Dibuat: `src/features/metadata/metadata-config.test.ts` (Unit test pembekuan snapshot immutable per capture)
  - Dibuat: `src/features/metadata/index.ts` (Barrel export fitur metadata)
  - Diperbarui: `src/components/icons/index.tsx` (Menambahkan `CrosshairIcon`, `SlidersIcon`, `EditIcon`)
  - Diperbarui: `src/features/camera/camera-screen.tsx` (Mengintegrasikan live GPS chip, interaktif tap status bar, live watermark HUD real-time, dan pembekuan snapshot saat shutter)

## Phase 5 - Capture Pipeline

- [✓] ✅ Task 5.1 - Pipeline Pengambilan Frame Kamera & Penyimpanan Lokal `[Sedang]` (Selesai)
  - Dibuat: `src/lib/image/frame-capture.ts` (Ekstraksi frame asli & thumbnail dari HTMLVideoElement aktif)
  - Dibuat: `src/lib/image/frame-capture.test.ts` (Unit test frame capture)
  - Dibuat: `src/features/camera/use-capture-pipeline.ts` (Orkestrasi alur capture: shutter -> freeze snapshot -> capture frame -> render watermark -> IndexedDB -> gallery update)
  - Dibuat: `src/features/camera/photo-preview-dialog.tsx` (Dialog pratinjau foto ber-watermark & download langsung)
  - Diperbarui: `src/features/camera/camera-controls.tsx` (Mendukung live thumbnail foto terakhir pada tombol galeri)
  - Diperbarui: `src/features/camera/camera-screen.tsx` (Wiring shutter capture, live flash effect, thumbnail preview, dan dialog unduh)
  - Diperbarui: `src/features/camera/index.ts` (Barrel export fitur camera)

## Phase 6 - Watermark Engine Rendering

- [✓] ✅ Task 6.1 - Perenderan Watermark Berbasis Canvas dengan Identitas Visual Resmi `[Sedang]` (Selesai)
  - Dibuat: `src/features/watermark/use-watermark-settings.ts` (Hook visual settings template Default, Ringkas, dan Detail)
  - Dibuat: `src/features/watermark/index.ts` (Barrel export fitur watermark)
  - Diperbarui: `src/lib/image/watermark-engine.ts` (Skala proporsional resolusi tinggi, panel Deep Navy `#08111d`, aksen emas `#c5984f`, stempel resmi logo aplikasi `app-icon.png`, dan output Blob terpisah)
  - Diperbarui: `src/lib/image/watermark-engine.test.ts` (Pengujian rendering stempel logoImage)

## Verifikasi Baseline & Build

- [✓] ✅ Task V.1 - Smoke test end-to-end lintas layer (session -> photo -> watermark -> zip) `[Sedang]` (Selesai)
  - File dibuat: `src/lib/integration.smoke.test.ts`
- [✓] ✅ Task V.2 - `pnpm typecheck`, `pnpm lint`, `pnpm test` seluruhnya lulus `[Mudah]` (Selesai)
  - 65/65 unit test lulus (18 test suites), 0 error TypeScript, 0 error ESLint
- [✓] ✅ Task V.3 - `pnpm build` lulus tanpa error Turbopack Next.js 16 `[Mudah]` (Selesai)

## Phase 9 & 10 - Multi-Photo Session & Session Gallery Drawer

- [✓] ✅ Task 9.1 - Multi-Photo Session Management & State `[Sedang]` (Selesai)
  - Dibuat: `src/features/sessions/use-session-gallery.ts` (Hook pengelola multi-sesi, pergantian sesi aktif, pembuatan sesi baru, penghitungan `undownloadedCount`, multi-select, single download, batch ZIP compression, dan cascade delete sesi & foto)
  - Dibuat: `src/features/sessions/use-session-gallery.test.ts` (Unit test pembentukan ZIP entries berurutan, eksekusi batch ZIP compression via fflate, status unduh, dan penghapusan foto/sesi di IndexedDB)
  - Diperbarui: `src/features/camera/use-capture-pipeline.ts` (Mengekspos `currentSessionId`, `reloadSessionPhotos`, serta auto-reset `lastPhoto` saat galeri dikosongkan)
- [✓] ✅ Task 10.1 - Session Gallery Drawer & Photo Grid UI `[Sedang]` (Selesai)
  - Dibuat: `src/features/sessions/session-gallery-drawer.tsx` (BottomSheet drawer mobile-first dengan session switcher, indikator peringatan foto belum diunduh PRD #14, toolbar aksi multi-select, unduh ZIP terpilih/semua, dialog konfirmasi hapus aman Rules #8.7-#8.8, dan thumbnail grid interaktif)
  - Dibuat: `src/features/sessions/index.ts` (Barrel export fitur sessions)
  - Diperbarui: `src/components/icons/index.tsx` (Menambahkan `PlusIcon`, `ArchiveIcon`, `CheckSquareIcon`, `SquareIcon`)
  - Diperbarui: `src/features/camera/camera-controls.tsx` (Mendukung rendering dinamis thumbnail foto terakhir dari sesi aktif via `GalleryThumbnailImage` dengan auto-cleanup Object URL)
  - Diperbarui: `src/features/camera/photo-preview-dialog.tsx` (Menambahkan callback `onDownload` dan `onDelete` untuk pratinjau resolusi penuh langsung dari galeri)
  - Diperbarui: `src/features/camera/camera-screen.tsx` (Wiring tombol galeri thumb-zone langsung ke `SessionGalleryDrawer` dengan auto-sync data sesi dan foto kamera)

## Phase 11 - Download Engine & Progress UI

- [✓] ✅ Task 11.1 - Single & Batch ZIP Download Trigger & Progress UI `[Sedang]` (Selesai)
  - Dibuat: `src/features/downloads/use-download-manager.ts` (State manager progres unduhan dengan tahapan `idle`, `preparing`, `compressing`, `downloading`, `completed`, `error`, fungsi murni `executeSingleDownload` & `executeBatchZipDownload`, dan generator entri ZIP terurut `prepareZipEntries`)
  - Dibuat: `src/features/downloads/download-progress-dialog.tsx` (Dialog visual progres unduhan mobile-first dengan live progress bar 0-100%, estimasi ukuran berkas ZIP, status foto, animasi ikon tahapan, tombol tutup/selesai, serta jaminan keamanan data Rules #10.5)
  - Dibuat: `src/features/downloads/use-download-manager.test.ts` (Unit test operasi single download, batch ZIP compression, pelacakan callback progres, dan penanganan kegagalan aman)
  - Dibuat: `src/features/downloads/index.ts` (Barrel export fitur downloads)
  - Diperbarui: `src/lib/downloads/zip-download.ts` (Menambahkan `ZipProgressCallback` dan pelacakan progres pembacaan buffer & kompresi)
  - Diperbarui: `src/lib/downloads/zip-download.test.ts` (Pengujian callback progres pada pembuatan ZIP)
  - Diperbarui: `src/features/sessions/use-session-gallery.ts` (Mendelegasikan unduhan ke `executeSingleDownload` dan `executeBatchZipDownload` serta mengekspos `reloadPhotos`)
  - Diperbarui: `src/features/sessions/session-gallery-drawer.tsx` (Integrasi `useDownloadManager` dan rendering `DownloadProgressDialog` saat tombol unduh ZIP ditekan)
  - Diperbarui: `src/features/camera/photo-preview-dialog.tsx` (Menggunakan `executeSingleDownload` agar unduhan mandiri otomatis memperbarui status `downloaded = true` di IndexedDB)

## Phase 12 - PWA Manifest & Service Worker

- [✓] ✅ Task 12.1 - PWA Manifest & Service Worker `[Sedang]` (Selesai)
  - Dibuat: `src/app/manifest.ts` (Web App Manifest Next.js App Router dengan nama "GeoPatriot Web — GPS Camera", mode standalone, tema Deep Navy `#08111d`, orientasi portrait, dan ikon 192x192 & 512x512 maskable/any)
  - Dibuat: `public/sw.js` (Service Worker client-side: precache app shell `/`, `/manifest.webmanifest`, `/app-icon.png`, strategi Stale-While-Revalidate untuk asset statis, Network-First dengan cache fallback untuk dokumen navigasi saat offline di lapangan, pembersihan cache lama saat aktivasi, dan isolasi ketat yang melarang cache data lokasi/API pihak ketiga sesuai Rules #14.3)
  - Dibuat: `src/features/pwa/use-pwa.ts` (Hook status online/offline, deteksi display mode standalone, registrasi otomatis service worker di production, dan event listener `beforeinstallprompt`)
  - Dibuat: `src/features/pwa/pwa-banner.tsx` (Banner visual adaptif: indikator "Mode Offline Lapangan" saat koneksi internet terputus dan tombol ajakan "Pasang Aplikasi" jika didukung peramban)
  - Dibuat: `src/features/pwa/index.ts` (Barrel export fitur PWA)
  - Dibuat: `src/features/pwa/pwa.test.ts` (Unit test konfigurasi manifest dan verifikasi perlindungan privasi cache lokasi Rules #14.3)
  - Diperbarui: `src/app/layout.tsx` (Metadata `appleWebApp` untuk iOS Safari PWA dan pemasangan `PwaBanner` di root layout)

## Phase 13 - Settings Sheet & Storage Indicator

- [✓] ✅ Task 13.1 - Settings Sheet & Storage Indicator `[Sedang]` (Selesai)
  - Dibuat: `src/lib/storage/photo-repository.ts` (`deleteDownloadedPhotos` & `clearAllPhotos` untuk pembersihan aman Rules #10.5)
  - Dibuat: `src/lib/storage/session-repository.ts` (`clearAllSessions` untuk pembersihan basis data sesi)
  - Dibuat: `src/lib/storage/settings-repository.ts` (`clearAllSettings` untuk reset preferensi lokal)
  - Dibuat: `src/features/settings/use-app-settings.ts` (Hook pusat pengaturan aplikasi: persistensi watermark settings, preferensi GPS/location provider, dan live storage meter via `navigator.storage.estimate()`)
  - Dibuat: `src/features/settings/settings-sheet.tsx` (Drawer BottomSheet 3 tab interaktif: "Watermark" [template, posisi, opacity slider, field toggles, custom note], "Lokasi & GPS" [provider switcher, high accuracy toggle, auto manual fallback], dan "Penyimpanan" [visual storage bar, counter foto terunduh, tombol pembersihan foto terunduh, dan modal konfirmasi hapus semua data])
  - Dibuat: `src/features/settings/index.ts` (Barrel export fitur settings)
  - Dibuat: `src/features/settings/settings.test.ts` (Unit test pembersihan foto terunduh, reset seluruh store IDB, dan inisialisasi default settings)
  - Diperbarui: `src/features/camera/camera-screen.tsx` (Integrasi tombol SettingsIcon di top header, sinkronisasi live watermark HUD & capture pipeline dengan `useAppSettings`, dan rendering `SettingsSheet`)

## Phase 14 - Error/Permission UX & Explicit States

- [✓] ✅ Task 14.1 - Error/Permission UX & Explicit States Audit `[Sedang]` (Selesai)
  - Dibuat: `src/types/diagnostics.ts` (Tipe state eksplisit sesuai `workflow-geopatriot-web.md` #16: `camera_idle`/`requesting`/`ready`/`denied`/`error`, `camera_zoom_supported`/`unsupported`/`error`, `gps_idle`/`searching`/`ready`/`denied`/`error`, `geocoding_loading`/`success`/`error`, `map_loading`/`success`/`error`, `storage_ok`/`warning`/`full`, dan kontrak `SystemHealthDiagnostics`)
  - Dibuat: `src/types/index.ts` (Mengekspor modul types diagnostics)
  - Dibuat: `src/features/diagnostics/use-system-diagnostics.ts` (Fungsi murni `evaluateSystemDiagnostics` dan hook `useSystemDiagnostics` untuk memetakan kesehatan subsistem, evaluasi ambang batas storage warning >=80% dan full >=95%, sinyal GPS buruk >50m, serta rekomendasi aksi lapangan)
  - Dibuat: `src/features/diagnostics/diagnostics-modal.tsx` (Drawer status sistem interaktif yang menampilkan 6 kartu status subsistem, indikator kuota, panduan izin peramban untuk iOS Safari & Android Chrome, serta tombol pemulihan cepat)
  - Dibuat: `src/features/diagnostics/storage-warning-banner.tsx` (Banner peringatan kapasitas memori IndexedDB proaktif dengan tombol kelola/pembersihan foto)
  - Dibuat: `src/features/diagnostics/gps-fallback-alert.tsx` (Banner peringatan sinyal GPS dengan tombol instan beralih ke Mode Manual agar surveyor tidak terhambat di lapangan)
  - Dibuat: `src/features/diagnostics/index.ts` (Barrel export modul diagnostics)
  - Dibuat: `src/features/diagnostics/diagnostics.test.ts` (Unit test pemetaan state optimal, deteksi izin ditolak, ambang storage warning/full, GPS buruk, dan mode offline fallback)
  - Diperbarui: `src/features/camera/camera-screen.tsx` (Integrasi tombol diagnostik logo emblem di top bar, rendering banner peringatan proaktif, dan modal `DiagnosticsModal`)

## Belum Dikerjakan (Next Steps)

- [ ] Task 15.1 - Phase 15: iPhone Safari Testing & Verification (Touch-action, WebKit zoom constraints fallback, orientation)
- [ ] Task 16.1 - Phase 16: Android Chrome Testing & PWA Install Audit
- [ ] Task 17.1 - Phase 17: Performance & Stress Testing (Benchmark 10, 25, 50, 100 foto)
- [ ] Task 18.1 - Phase 18: Vercel Deployment Preparation & Production Checklist
- [ ] Task 19.1 - Phase 19: Final Release Checklist & Definition of Done (DoD) Audit

## Ringkasan Checkpoint Saat Ini

Phase 14 (Error/Permission UX & Explicit States) telah selesai 100%.
Pengguna kini dapat:
1. Membuka panel "Diagnostik Sistem Lapangan" secara langsung dengan mengetuk emblem logo GeoPatriot pada header kamera.
2. Memantau kesehatan 6 subsistem utama secara eksplisit (`camera`, `cameraZoom`, `gps`, `geocoding`, `map`, `storage`) dengan kode status transparan.
3. Menerima panduan pemulihan izin kamera dan GPS yang ramah dan spesifik untuk Android Chrome dan iOS Safari.
4. Mendapatkan banner peringatan otomatis saat kapasitas memori IndexedDB mencapai ambang batas warning (>=80%) atau full (>=95%) dengan aksi cepat ke menu pembersihan.
5. Mendapatkan notifikasi dan tawaran langsung beralih ke Mode Manual saat izin GPS ditolak atau saat akurasi GPS lapangan menurun drastis (>50m).
Seluruh 74 unit test lulus (20 test suites), 0 error TypeScript, 0 error ESLint, dan build produksi Next.js 16 Turbopack sukses.

