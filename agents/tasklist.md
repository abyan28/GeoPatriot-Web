# Tasklist - GeoPatriot Web

Progress: 100% (implementasi fungsional) — lihat "Audit & Remediasi" di bawah
untuk status yang lebih akurat sebelum klaim "siap production".

Catatan: Layer non-UI (Phase 0, types, lib) dikerjakan oleh Claude Code.
Layer UI/Frontend (Phase 1, 2, dst.) dikerjakan oleh Antigravity.
Audit independen (5 domain) dan remediasi P0/P1/sebagian P2 dikerjakan oleh Claude Code.

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

## Phase 15 - iPhone Safari Testing & Verification

- [✓] ✅ Task 15.1 - iPhone Safari Compatibility Verification `[Sedang]` (Selesai)
  - Dibuat: `src/lib/browser/mobile-compatibility.test.ts` (Pengujian simulasi WebKit Safari iOS: penanganan ketiadaan properti zoom pada `MediaTrackCapabilities`, fallback aman saat `applyConstraints` zoom ditolak tanpa crash, verifikasi `touch-action: none` pada container viewfinder, dan penanganan orientasi portrait 9:16 serta landscape 16:9)
  - Diperiksa & Diverifikasi: Atribut `autoPlay`, `playsInline`, dan `muted` pada tag `<video>` di `CameraViewport` untuk kepatuhan WebKit iOS Safari.

## Phase 16 - Android Chrome Testing & Verification

- [✓] ✅ Task 16.1 - Android Chrome Compatibility Verification `[Sedang]` (Selesai)
  - Dibuat: `src/lib/browser/mobile-compatibility.test.ts` (Pengujian native hardware zoom Android Chrome: ekstraksi kapabilitas min/max/step, format constraint advanced `{ advanced: [{ zoom }] }`, dan verifikasi akurasi GPS lapangan presisi tinggi)
  - Diperiksa & Diverifikasi: PWA standalone manifest dan deferred install prompt listener pada Android Chrome.

## Phase 17 - Performance & Stress Testing

- [✓] ✅ Task 17.1 - Performance & Stress Testing `[Sedang]` (Selesai)
  - Dibuat: `src/lib/performance.benchmark.test.ts` (Pengujian beban batch 10, 25, 50, hingga 100 foto pada IndexedDB: rata-rata tulis < 15ms per foto, pembacaan seluruh galeri 100 foto < 250ms, kompresi ZIP client-side 50 foto < 1 detik, dan latensi layouting watermark 100 foto < 0.1ms per item).

## Phase 18 - Vercel Deployment Preparation

- [✓] ✅ Task 18.1 - Vercel Deployment Configuration & Security Headers `[Sedang]` (Selesai)
  - Diperbarui: `next.config.ts` (Menambahkan security headers HTTP production: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, dan `Permissions-Policy: camera=(self), geolocation=(self), microphone=()`)
  - Diverifikasi: Build produksi Next.js 16 Turbopack (`next build`) lulus optimal dengan static site generation untuk `/`, `/_not-found`, dan `/manifest.webmanifest`.

## Phase 19 - Final Release Checklist & Definition of Done (DoD)

- [✓] ✅ Task 19.1 - Final Release Checklist & DoD Audit `[Mudah]` (Selesai, klaim diperbaiki setelah audit independen — lihat bagian di bawah)
  - Fungsional: Kamera, camera zoom, live GPS tracking, manual fallback, watermark canvas rendering, multi-photo sessions, galeri, ZIP download, PWA offline, pengaturan, diagnostik sistem.
  - Privasi & Keamanan: Local-first 100% tanpa upload server (Rules #1.1 & #8.1), opsi pembersihan aman foto terunduh (Rules #10.5), isolasi cache offline tanpa data lokasi pribadi (Rules #14.3).
  - Kompatibilitas: **KOREKSI** — sebelumnya diklaim "Android Chrome, iOS Safari, desktop teruji". Audit independen (lihat di bawah) menemukan klaim ini HANYA didukung unit test simulasi API di Node (`mobile-compatibility.test.ts`), BUKAN pengujian di device/browser fisik. Status sebenarnya: **NOT VERIFIED on real device**.
  - Kualitas Kode: 95/95 unit & integration test lulus (27 test suites), 0 error TypeScript, 0 warning ESLint, Turbopack production build sukses (naik dari 83 setelah audit & remediasi lanjutan menambah regression test untuk watermark truncation, map thumbnail, ZIP-failure-path, cascade-delete via hook, dan protokol ZIP Web Worker).

## Ringkasan Checkpoint Akhir (Direvisi Setelah Audit)

Implementasi fungsional 19 fase selesai dan quality gates (typecheck/lint/test/build) benar-benar lulus.
**Klaim "siap dirilis ke Vercel Production" pada versi tasklist sebelumnya terlalu prematur** — lihat bagian
"Audit Independen & Remediasi" di bawah untuk kondisi sebenarnya sebelum deploy publik.

## Audit Independen & Remediasi (Pasca Phase 19)

Dilakukan audit read-only menyeluruh (5 domain paralel: camera/zoom, geolocation/metadata/watermark,
storage/session/download, PWA/privacy/security, settings/accessibility/UX) terhadap source code aktual,
bukan hanya membaca tasklist. Laporan lengkap (37 kategori temuan, format ID/Severity/Evidence/Recommendation)
tersedia di riwayat percakapan sesi ini. Ringkasan hasil dan remediasi yang SUDAH dieksekusi:

### Sudah diperbaiki (kode)
- [✓] ✅ **P0** — Tidak ada `prefers-reduced-motion` di seluruh app. Ditambahkan guard global di `src/app/globals.css`.
- [✓] ✅ **P1** — Race condition camera flip (dua `getUserMedia` konkuren). Ditambahkan lock re-entrancy `isTransitioningRef` di `src/features/camera/use-camera.ts` (`start`, `toggleFacingMode`).
- [✓] ✅ **P1** — Kamera tetap menyala saat app di background. Ditambahkan handler `visibilitychange` di `src/features/camera/use-camera.ts` (stop otomatis saat hidden, restart saat kembali visible).
- [✓] ✅ **P1** — Race condition reverse geocoding (alamat basi menimpa alamat baru). Ditambahkan staleness guard `geocodeRequestIdRef` di `src/features/location/use-geolocation.ts`.
- [✓] ✅ **P1** — Dialog/BottomSheet tanpa focus trap & focus return. Dibuat hook bersama `src/components/ui/use-overlay-behavior.ts`, diwire ke `Dialog.tsx` & `BottomSheet.tsx` (focus trap, initial focus, focus-return ke trigger, `useId()` untuk id unik, handle bar jadi `<button>` asli).
- [✓] ✅ **P1** — Settings lama dari IndexedDB di-load tanpa merge default. Diperbaiki di `src/features/settings/use-app-settings.ts` (merge dengan `createDefaultTemplate()`/`DEFAULT_LOCATION_SETTINGS`).
- [✓] ✅ **P2** — Shutter tidak punya guard idempotency di level fungsi + TOCTOU pada `ensureActiveSession`. Ditambahkan `isCapturingRef` + in-flight promise cache `ensureSessionPromiseRef` di `src/features/camera/use-capture-pipeline.ts`.
- [✓] ✅ **P2** — Cascade delete session+foto tidak atomic, bisa stale UI. Diperbaiki `clearCurrentSession` di `src/features/sessions/use-session-gallery.ts` agar selalu resync state dari IndexedDB setelah operasi (bukan optimistic clear).
- [✓] ✅ **P2** — Multi-select delete: foto gagal dihapus tetap hilang dari UI (state-storage desync). Diperbaiki `deleteSelectedPhotos` agar hanya menghapus dari state ID yang benar-benar sukses (`succeededIds`).
- [✓] ✅ **P2** — Race condition rapid session switching. Ditambahkan staleness guard `latestSessionRequestRef` di `loadPhotosForSession`.
- [✓] ✅ **P2** — Error load session/photo ditelan diam-diam. Ditambahkan field `loadError` yang diekspos hook `useSessionGallery`.
- [✓] ✅ **P2** — Watermark HUD overlay & StatusChip GPS (jalur pemulihan utama) tidak keyboard-accessible. Ditambahkan `tabIndex`/`onKeyDown` di `camera-screen.tsx`; `StatusChip.tsx` sekarang otomatis interaktif (tabIndex+role+Enter/Space) saat diberi `onClick`.
- [✓] ✅ **P2** — `GpsFallbackAlert` kurang actionable untuk akurasi rendah. Ditambahkan saran "pindah ke area terbuka" + label tombol dibedakan dari kasus permission denied.
- [✓] ✅ **P2** — Watermark text overflow (alamat panjang tidak wrap/truncate). Ditambahkan `measureText` + `truncateTextToWidth` (ellipsis) di `src/lib/image/watermark-engine.ts`, dengan regression test baru.
- [✓] ✅ **P3** — Pewarnaan teks watermark berbasis heuristik string (salah warna untuk custom text berisi koma/titik). Diganti dengan field semantik `WatermarkLineKind` di `src/lib/image/watermark-layout.ts` + `watermark-engine.ts`.
- [✓] ✅ **P3** — Tidak ada `maxLength` pada input lokasi manual. Ditambahkan di `metadata-editor-sheet.tsx` (`locationName` 100, `address` 120).
- [✓] ✅ **P3** — Cache service worker exclusion substring-match bukan origin-check. Diganti jadi default-deny same-origin di `public/sw.js` (`isSafeToCache`).
- [✓] ✅ **P3** — Cache versioning tidak auto-bump. `CACHE_NAME` dinaikkan ke v2 + komentar instruksi bump manual per deploy signifikan.
- [✓] ✅ **P4** — Manifest icon size mismatch (declared 192x192/512x512 vs file aktual 1024x1024). Diperbaiki `src/app/manifest.ts` agar `sizes` cocok dimensi file aktual.
- [✓] ✅ **P4** — Hardcode IP developer di `next.config.ts` (`allowedDevOrigins`). Dihapus, auto-detect IPv4 lokal sudah cukup.
- [✓] ✅ **P4** — Touch target varian `Button` `sm` 40px & tombol Settings header 32px, di bawah standar 44px. Dinaikkan ke 44px.
- [✓] ✅ Dead/misleading `providerAttribution: "GeoPatriot"` (field tidak pernah dibaca rendering, membingungkan). Dihapus dari `use-capture-pipeline.ts`.

### Lanjutan Remediasi (Sesi ke-2 — semua item non-device dari sesi pertama)

- [✓] ✅ Fitur **map thumbnail & provider attribution watermark** — sebelumnya dead feature, sekarang benar-benar diimplementasikan dan diuji.
  - `src/features/location/use-geolocation.ts`: opsi `resolveMapThumbnail`, fetch static map via `getMapProvider().getStaticMap()` dengan cache key + staleness guard + object URL lifecycle (revoke lama saat diganti/unmount) yang sama pola dengan reverse geocoding.
  - `src/lib/browser/load-image.ts` (baru, + test): helper `loadImageFromUrl()` mengonversi object URL jadi `HTMLImageElement` untuk `drawImage`, dengan timeout aman.
  - `src/lib/image/watermark-engine.ts`: `drawWatermarkPanel` sekarang benar-benar menggambar `mapThumbnailImage` sebagai blok terpisah di sisi kanan panel + attribution provider (`© LocationIQ`) di bawahnya, tidak pernah tertutup elemen lain (rules #6.4-6.5). 2 regression test baru (render map, dan TIDAK render saat `visibleFields.mapThumbnail` nonaktif meski image tersedia).
  - `src/features/camera/use-capture-pipeline.ts`: wiring `mapThumbnailUrl` -> `loadImageFromUrl` -> `renderWatermark`, gagal secara graceful (rules #6.6) tanpa menggagalkan capture.
  - `src/features/camera/camera-screen.tsx`: `useAppSettings()` dipindah sebelum `useGeolocation()` agar `resolveMapThumbnail` bisa mengikuti toggle `watermarkSettings.visibleFields.mapThumbnail` (tidak fetch map bila fitur nonaktif, menghemat kuota LocationIQ).
- [✓] ✅ Nilai `zoom` di `MetadataSnapshot` sekarang dibaca dari `getCameraCurrentZoom(cameraStream)` (ground truth hardware) tepat di titik `createSnapshot()`, bukan dari React state UI yang bisa stale. Diperbaiki di `camera-screen.tsx`.
- [✓] ✅ Pinch-to-zoom di-throttle via `requestAnimationFrame` (hanya nilai terbaru per frame yang dikirim ke `onZoomChange`) di `camera-viewport.tsx`; ditambah staleness guard `zoomRequestIdRef` di `use-camera.ts` agar hasil `applyConstraints()` basi tidak menimpa state zoom yang lebih baru.
- [✓] ✅ Test coverage gap ZIP-failure-path: `src/lib/downloads/zip-download-failure.test.ts` (mock `fflate.zip()` reject) dan `src/features/downloads/use-download-manager-zip-failure.test.ts` (verifikasi `downloaded` tetap `false` & anchor tidak pernah di-klik saat ZIP gagal).
- [✓] ✅ Test coverage gap cascade-delete via hook produksi: install `jsdom` + `@testing-library/react`, dibuat `src/features/sessions/use-session-gallery.hook.test.ts` (`// @vitest-environment jsdom` per-file) yang memanggil `clearCurrentSession()` dan `deleteSelectedPhotos()` sungguhan lewat `renderHook`, bukan hanya repository terisolasi.
- [✓] ✅ CSP header ditambahkan di `next.config.ts` (`script-src 'self' 'unsafe-inline'` — wajib untuk RSC streaming inline script Next.js App Router; `connect-src 'self' + LocationIQ` sebagai perlindungan utama exfiltrasi). **CATATAN: belum diverifikasi di browser nyata** — build produksi lulus tapi CSP violation hanya akan terlihat di console browser sungguhan.

### Lanjutan Remediasi (Sesi ke-3 — ZIP Web Worker & koreksi dokumentasi)

- [✓] ✅ **ZIP compression dipindah ke Web Worker** (sebelumnya ditunda karena dianggap tidak bisa diverifikasi tanpa device — ternyata BISA dengan pendekatan konservatif berikut, jadi dieksekusi):
  - `src/lib/downloads/zip-worker.ts` (baru): Worker terpisah yang HANYA menjalankan `fflate.zip()` (tahap CPU-bound); tahap baca Blob tetap di main thread (murah, sudah ada progress-nya).
  - `src/lib/downloads/zip-download.ts`: `createZipBlob()` sekarang mencoba `compressInWorker()` dulu bila `typeof Worker !== "undefined"`, dengan timeout 30 detik dan `onerror` handler; **fallback otomatis** ke `compressSync()` (kode lama yang sudah teruji) bila Worker gagal di titik manapun (construct throw, onerror, timeout) — capture/download tidak pernah gagal hanya karena Worker bermasalah (rules #10.5/#10.7).
  - Sengaja **tidak memakai transfer list** pada `postMessage` (structured-clone copy, bukan transfer/detach) — `zippable` di main thread tetap valid untuk fallback tanpa perlu membaca ulang Blob.
  - `src/lib/downloads/zip-worker-protocol.test.ts` (baru): mock global `Worker` untuk 3 skenario — sukses (hasil ZIP di-unzip ulang & dicocokkan byte-per-byte dengan entries asli), `onerror` dari worker (fallback tetap sukses), construct `Worker` throw (fallback tetap sukses). Seluruh test lama (`zip-download.test.ts` dkk) tetap lulus tanpa diubah karena environment Node tidak punya `Worker` global — otomatis menjalankan jalur fallback sebagai regression coverage gratis.
  - **Diverifikasi lewat `pnpm build`**: Turbopack benar-benar mengemit chunk worker terpisah (`.next/static/chunks/turbopack-worker-*.js` + `.next/static/media/zip-worker...ts`) — bukan cuma "build tidak error", tapi bukti konkret pola `new Worker(new URL(...))` diproses dan di-bundle dengan benar oleh Turbopack untuk setup proyek ini.
  - **MASIH NOT VERIFIED tanpa browser/device nyata**: korektnes hasil ZIP dan korektnes fallback sudah diuji unit test; manfaat performanya (UI tidak freeze pada sesi 50-200 foto ukuran asli di perangkat mobile sungguhan) belum bisa dikonfirmasi tanpa device fisik.

- [✓] ✅ **Koreksi dokumentasi provenance `public/app-icon.png`** (klarifikasi langsung dari pemilik proyek, 2026-09-16): Aplikasi GeoPatriot Web **bukan** produk/milik Kementerian Transmigrasi. Hanya **palet warna** dari logo Kementerian Transmigrasi yang dijadikan referensi visual (Deep Navy & Golden Ochre) — tidak ada aset/logo resmi kementerian yang dipakai sebagai file dalam proyek ini. **Lisensi dan kepemilikan program ini adalah milik Tim Ekspedisi Patriot (TEP) Kobalima Timur.** Catatan "perlu diverifikasi" pada temuan audit sebelumnya sudah tidak berlaku.

Progress non-device sekarang 100% dari seluruh temuan audit termasuk ZIP Web Worker — sisa yang
tercatat di bawah murni butuh device/browser nyata untuk verifikasi (bukan lagi soal risiko
implementasi kode).

### WAJIB dilakukan sebelum klaim "production-ready" (tidak bisa diselesaikan lewat kode)
- [ ] **Verifikasi real-device**: Android Chrome & iPhone Safari fisik — camera, zoom, GPS, watermark visual (termasuk overflow & map thumbnail baru), PWA install, offline, dan performa ZIP Worker pada sesi besar. Tasklist Phase 15-16 sebelumnya HANYA didukung unit test simulasi, bukan device nyata.
- [ ] **Verifikasi performa nyata**: benchmark 10-200 foto ukuran asli (300KB-3MB) di browser sungguhan — benchmark sebelumnya (`performance.benchmark.test.ts`) sintetis (fake-indexeddb, Blob 2-4KB). Termasuk memverifikasi ZIP Worker benar-benar mencegah UI freeze pada sesi besar.
- [ ] **Verifikasi CSP di browser nyata**: buka DevTools console setelah deploy, pastikan tidak ada CSP violation yang memblokir hydration/font/style Next.js, dan LocationIQ tetap bisa diakses.
- [ ] Verifikasi HTTPS actual pada domain Vercel production setelah deploy.

## Sesi Lanjutan: Fix Galeri, Watermark Alignment, Landscape, Input Koordinat, PWA/Fullscreen

Progress: implementasi selesai untuk 5 item di bawah (A-E). Quality gate (typecheck/lint/
test/build) lulus semua. **Belum di-commit** — menunggu instruksi eksplisit user.

### A. Fix bug galeri foto tidak ter-load
- [✓] ✅ Root cause: atribut `loading="lazy"` pada `<img>` thumbnail di
  `src/features/sessions/session-gallery-drawer.tsx` — satu-satunya perbedaan dari pola
  object-URL identik yang sudah bekerja di `camera-controls.tsx`. Dikombinasikan dengan 2
  lapis scroll-container bersarang (`BottomSheet` + grid) + animasi masuk saat mount,
  heuristik native lazy-loading browser salah menyimpulkan elemen di luar viewport.
  * Diubah: `src/features/sessions/session-gallery-drawer.tsx` (hapus `loading="lazy"`)
  * **NOT VERIFIED tanpa browser nyata**: perlu dicoba ulang oleh user untuk konfirmasi
    thumbnail benar-benar tampil setelah fix.

### B. Input koordinat manual digabung jadi satu field
- [✓] ✅ Field lat/lng terpisah (`type="number"`) diganti satu input teks yang menerima
  paste format Google Maps (`-9.620308,124.879609`, dengan/tanpa spasi, atau spasi saja).
  * Dibuat: `src/features/metadata/parse-coordinate-pair.ts` (`parseCoordinatePair`,
    `formatCoordinatePair`) + test (valid koma/spasi, invalid, out-of-range, batas ±90/±180)
  * Diubah: `src/features/metadata/metadata-editor-sheet.tsx` (state `coordinateText`/
    `coordinateError`, validasi inline, tombol "Salin dari GPS" ikut sinkron field baru)
  * Tidak mengubah `ManualLocationInput` type — hanya cara input UI.

### C. Selaraskan angka watermark ke referensi mobile GeoPatriot
- [✓] ✅ Nilai default per template (`opacity`, `fontSizePx`, `marginPx`, `radiusPx`,
  `spacingPx`, `mapThumbnailSizePx`, `visibleFields.altitude`) diselaraskan dengan hasil
  tuning device nyata di `referensi/GeoPatriot-main/lib/watermark/`. Field baru `mapZoom`
  ditambahkan dan benar-benar dipakai (bukan kosmetik) untuk level zoom static map.
  Visual style web (Deep Navy panel, teks berwarna per-field, logo inline) **SENGAJA
  dipertahankan** sesuai keputusan user — bukan full rewrite ke gaya mobile (panel
  auto-size/badge terpisah/teks putih polos/panel hitam). Posisi tetap 2 opsi (top/bottom).
  * Diubah: `src/types/watermark.ts` (+`mapZoom`), `src/lib/image/templates/{default,ringkas,detail}.ts`
    (nilai baru), `src/features/location/use-geolocation.ts` (`mapZoom` opsi hook, bukan
    hardcode 16), `src/features/camera/camera-screen.tsx` (teruskan `mapZoom`),
    `src/lib/storage/session-repository.test.ts` & `src/lib/image/watermark-layout.test.ts`
    (sesuaikan fixture/assertion ke nilai & default baru)
  * **NOT VERIFIED tanpa browser nyata**: hasil visual watermark baru (opacity/font/spacing)
    hanya diverifikasi lewat nilai numerik di unit test, belum dilihat mata di foto nyata.

### D. Buka kunci orientasi landscape
- [✓] ✅ `src/app/manifest.ts`: `orientation: "portrait"` → `"any"`. Pipeline watermark/
  capture tidak diubah (sudah adaptif terhadap dimensi aktual).
  * Diubah: `src/app/manifest.ts`, `src/features/pwa/pwa.test.ts` (assertion disesuaikan)
  * **NOT VERIFIED tanpa device nyata — TIDAK ADA JAMINAN**: web tidak punya API setara
    "lock capture orientation" milik native (dikonfirmasi dari `camera_controller_service.dart`
    di referensi mobile). Hasil capture landscape bergantung pada bagaimana
    browser/device melaporkan `video.videoWidth`/`videoHeight`, yang TIDAK konsisten
    antar browser/device.

### E. PWA Standalone Audit + Fullscreen Camera Experience

**A. Ringkasan perubahan**: PWA tidak diubah (sudah memadai, lihat poin B). Fitur baru:
Fullscreen API dengan capability detection, state sinkron dari browser sungguhan, toggle
button di header, safe-area insets di header & kontrol bawah.
- Dibuat: `src/lib/browser/fullscreen.ts` (+test), `src/features/camera/use-fullscreen.ts` (+test jsdom)
- Diubah: `src/components/icons/index.tsx` (+`MaximizeIcon`/`MinimizeIcon`),
  `src/features/camera/camera-screen.tsx` (rootRef, tombol fullscreen di header, `max-w-none`
  kondisional, safe-area header), `src/features/camera/camera-controls.tsx` (safe-area footer)

**B. PWA**: `display: "standalone"`, `name`/`short_name`/`start_url`/`theme_color`/
`background_color`/icon `any`+`maskable` di `manifest.ts` sudah benar (icon size sudah
diperbaiki sesi audit sebelumnya). `viewportFit: "cover"` di `layout.tsx` sudah ada
(prasyarat wajib `env(safe-area-inset-*)` bekerja di iOS). `use-pwa.ts`/`pwa-banner.tsx`
(standalone detection, install prompt, service worker) sudah lengkap. **Tidak ada perubahan
kode PWA** kecuali `orientation` (lihat bagian D, terpisah dari task fullscreen ini).

**C. Fullscreen**: `src/lib/browser/fullscreen.ts` membungkus `requestFullscreen()`/
`exitFullscreen()` cross-vendor (standard + `webkit*` untuk Safari), tidak pernah throw.
`use-fullscreen.ts` men-derive `isFullscreen` HANYA dari event `fullscreenchange` yang
membaca `document.fullscreenElement` sesungguhnya — bukan diasumsikan dari hasil
request/exit — supaya tetap sinkron saat user keluar lewat tombol browser/Escape/gesture
platform, bukan hanya lewat tombol app. Target fullscreen adalah root div `camera-screen.tsx`;
`max-w-md mx-auto` dilepas jadi `max-w-none` secara kondisional saat fullscreen aktif agar
tidak muncul letterbox kosong.

**D. Browser fallback**: `isFullscreenSupported()` menyembunyikan tombol total bila browser
tidak mendukung (bukan tombol yang selalu ada tapi gagal diam-diam). Bila `requestFullscreen`/
`exitFullscreen` reject (permission/user-gesture/browser), `toggleFullscreen()` mengembalikan
`{status:"error"}` (bukan throw) dan `camera-screen.tsx` menampilkan toast ringan "Layar
penuh tidak tersedia di browser ini." — sekali per klik, tidak berulang per render.

**E. Camera compatibility**: Zoom (camera & map), watermark engine, capture pipeline,
metadata snapshot, session gallery, IndexedDB, download/ZIP, LocationIQ provider, service
worker **TIDAK disentuh sama sekali** — Fullscreen hanya membungkus toggle di layer terluar.

**F. Tests**: 116/116 test lulus (30 test suite, naik dari 95 — tambahan test untuk
`parseCoordinatePair`, `fullscreen.ts`, `use-fullscreen.ts`, plus penyesuaian 2 test lama ke
nilai/default baru). TypeScript: **PASS**. ESLint: **PASS**. Production build (`next build`,
Turbopack): **PASS**.

**G. Device verification**:
- **Verified** (lewat unit test, bukan device nyata): logic capability-detection Fullscreen
  API (browser mendukung/tidak), state toggle request→exit, sinkronisasi state saat keluar
  fullscreen lewat event eksternal (simulasi), penanganan reject tanpa throw; logic parser
  koordinat gabungan (semua kasus format); nilai numerik template watermark baru.
- **Not verified** (WAJIB device/browser nyata, belum dilakukan sesi ini): perilaku
  Fullscreen API sungguhan di Android Chrome, iPhone Safari (termasuk keterbatasan versi
  &lt;16.4 yang historisnya tidak mendukung fullscreen elemen sembarang sama sekali, hanya
  `<video>`), Desktop Chrome/Safari; rendering `env(safe-area-inset-*)` nyata di device
  bernotch/Dynamic Island/home-indicator; letterboxing fix (`max-w-none`) di layar
  besar/landscape sungguhan; galeri benar-benar tampil (Bagian A); hasil visual watermark
  baru (Bagian C); landscape capture (Bagian D).

**H. Dokumentasi**: `agents/tasklist.md` (bagian ini). PRD/rules/workflow tidak diubah
(fitur fullscreen belum didokumentasikan formal di sana — bisa ditambahkan terpisah bila
user ingin menjadikannya bagian resmi product behavior).

**I. Remaining issues**:
- iOS Safari versi lama (&lt;16.4) kemungkinan tidak menampilkan tombol fullscreen sama
  sekali (`isFullscreenSupported()` akan false) — ini fallback yang benar, bukan bug, tapi
  berarti fitur ini efektif tidak tersedia di sebagian populasi iPhone lama.
  Non-goals task ini SEMUA dipatuhi: tidak ada native app/APK/IPA/Capacitor/Cordova/Electron,
  tidak ada backend/database baru, tidak ada perubahan provider LocationIQ/watermark engine/
  camera pipeline di luar yang didokumentasikan, tidak ada dependency baru, tidak ada
  commit/push (menunggu instruksi user).

## Sesi Lanjutan: Fix Bug dari Uji Coba Nyata (keyboard, geocode manual, foto hitam, scroll landscape)

User mencoba app secara nyata dan melaporkan 5 hal. 4 di antaranya root cause-nya dikonfirmasi
dari kode langsung dan sudah diperbaiki; 1 (fullscreen exit) dicek dan TIDAK ada bug kode.

### 1. [✓] ✅ Keyboard HP muncul lalu langsung tenggelam saat mengetik di form manapun
Root cause: `src/components/ui/use-overlay-behavior.ts` — effect auto-focus-grab punya
dependency `onClose`, yang selalu inline arrow function baru di setiap render
`camera-screen.tsx`. `CameraScreen` re-render tiap 1 detik (`liveClock` interval), jadi tiap
detik effect ini re-fire dan MEREBUT FOKUS balik ke elemen focusable pertama sheet — persis
membuat keyboard HP langsung hilang tiap kali muncul.
* Diubah: `src/components/ui/use-overlay-behavior.ts` — `onClose` dipisah ke `onCloseRef`
  (di-update via effect terpisah `[onClose]`), effect utama (focus-grab, body-lock, tab-trap)
  sekarang hanya depend ke `[isOpen, containerRef]`, tidak lagi re-run karena parent re-render.
* Berlaku otomatis ke SEMUA sheet (Settings/Metadata/Gallery/Diagnostics) karena satu hook
  dipakai bersama oleh `Dialog.tsx` & `BottomSheet.tsx`.
* **NOT VERIFIED tanpa device nyata**: perlu dicoba ulang mengetik di field manapun (terutama
  koordinat manual) untuk konfirmasi keyboard tidak lagi hilang sendiri.

### 2. [✓] ✅ Input koordinat manual sekarang memicu alamat & map thumbnail LocationIQ
Root cause: tidak ada wiring sama sekali dari mode manual ke provider geocoding/map — bukan
regresi, memang belum pernah dibuat.
* Diubah: `src/features/location/use-geolocation.ts` (opsi `isManualLocationActive` — GPS
  watch skip resolve address/map saat manual aktif agar tidak berebut state; fungsi baru
  `resolveForCoordinate(lat, lon)` reuse penuh staleness-guard & object-URL lifecycle yang
  sudah ada), `src/features/metadata/use-metadata-config.ts` (rename param `gpsAddressInfo` →
  `resolvedAddressInfo`, dipakai GPS ATAU manual; branch manual fallback ke resolved address
  HANYA bila field manual kosong — tidak menimpa input user), `src/features/camera/camera-screen.tsx`
  (`useEffect` memicu `resolveForCoordinate` saat koordinat manual berubah; HUD
  `activeLocationName`/`activeAddress` fallback ke hasil resolve).
  Map thumbnail untuk foto mode manual JUGA ikut terisi (state yang sama dipakai capture
  pipeline), bukan hanya alamat di HUD.
* Test baru: `src/features/metadata/metadata-config.test.ts` (fallback hanya saat field
  manual kosong, tidak menimpa input user yang sudah diisi).
* **NOT VERIFIED tanpa device nyata**: perlu dicoba isi koordinat manual lalu cek alamat &
  map thumbnail benar-benar muncul di HUD dan di watermark foto akhir.

### 3. [✓] ✅ Foto terbaru tampil hitam (foto lama tetap normal) — kemungkinan besar sudah teratasi
Root cause (investigasi mendalam, paling kuat): `src/lib/image/frame-capture.ts` tidak pernah
cek `video.readyState` sebelum `drawImage`, dan `use-camera.ts` menandai status "ready"
(mengaktifkan shutter) TEPAT setelah `getUserMedia()` resolve — sebelum frame pertama
benar-benar ter-decode. Capture di kondisi ini menghasilkan Blob JPEG valid ukurannya tapi
ISI-nya hitam polos (beda dari kasus "Blob corrupt" yang sudah diaudit sebelumnya). Diperbesar
oleh kenaikan resolusi kamera ke ideal 1920×1080 (decode makin lama). `thumbnailBlob` digambar
dari canvas yang sama, jadi ikut hitam — cocok dengan gejala (thumbnail galeri & foto full-res
sama-sama kena, foto lama normal karena stream sudah lama `readyState = HAVE_ENOUGH_DATA`).
* Diubah (2 lapis pertahanan):
  1. `src/lib/browser/camera.ts`: fungsi baru `waitForVideoFrame(video, timeoutMs=3000)` —
     resolve segera bila `readyState >= HAVE_CURRENT_DATA`, else tunggu event `loadeddata`
     dibatasi timeout (timeout tetap resolve, tidak pernah hang capture selamanya).
  2. `src/features/camera/use-camera.ts`: `start()` & `toggleFacingMode()` — `setStatus("ready")`
     dipindah ke SETELAH `attachStreamToVideo()` + `await waitForVideoFrame()`, bukan langsung
     setelah stream resolve. Shutter baru aktif setelah frame pertama benar-benar ter-decode.
  3. `src/lib/image/frame-capture.ts`: guard defensif di awal `captureVideoFrame` — bila
     `readyState < HAVE_CURRENT_DATA`, return error eksplisit ("Kamera belum benar-benar siap")
     alih-alih `drawImage` yang berisiko hasil hitam (jaga-jaga jalur lain di luar #2).
* Test baru: `src/lib/browser/camera.test.ts` (`waitForVideoFrame`: resolve segera/tunggu
  event/timeout tetap resolve), `src/lib/image/frame-capture.test.ts` (readyState guard
  return error, drawImage TIDAK terpanggil).
* **MASIH NOT VERIFIED tanpa device nyata — ini root cause PALING KUAT dari analisis kode,
  bukan kepastian mutlak**: agen investigasi mencatat perlu dikonfirmasi apakah foto hitam
  terjadi di SETIAP shutter press (didukung penuh oleh fix ini) atau hanya capture
  pertama/setelah flip kamera (yang juga dicakup fix ini). Coba ambil beberapa foto berturut
  di device nyata untuk memastikan tidak ada lagi foto hitam.

### 4. Fullscreen exit — TIDAK ADA BUG, tidak ada perubahan kode
Dicek ulang `camera-screen.tsx` & `use-fullscreen.ts`: tombol yang sama (ikon berubah
Maximize↔Minimize) memanggil `toggleFullscreen()`, yang otomatis memanggil `exitFullscreen()`
saat `isFullscreen === true`. Logic benar. Bila di device tertentu user masih merasa tidak
bisa keluar, kemungkinan besar perilaku browser spesifik (di luar kendali kode) — butuh info
device/browser untuk investigasi lanjut bila memang masih bermasalah.

### 5. [✓] ✅ Panel pengaturan tidak bisa di-scroll saat landscape
Root cause: `src/components/ui/BottomSheet.tsx` — div konten `overflow-y-auto flex-1` tidak
punya `min-h-0` (bug flexbox klasik: flex item dengan `flex-1` tetap `min-height:auto` default,
mencegah shrink, sehingga konten mendorong keluar `max-h-[85vh]` alih-alih scroll internal).
Tersamarkan di portrait (viewport tinggi cukup), kentara di landscape (viewport pendek) +
`document.body.style.overflow="hidden"` (dari `useOverlayBehavior`) mengunci scroll body juga
sehingga konten yang overflow benar-benar tidak terjangkau.
* Diubah: `src/components/ui/BottomSheet.tsx` (+`min-h-0`). Berlaku otomatis ke SEMUA sheet.
* **NOT VERIFIED tanpa device nyata**: perlu dicoba putar HP ke landscape, buka Settings,
  scroll ke bawah untuk konfirmasi.

**Kualitas kode**: 122/122 test lulus (30 suite, naik dari 116 — tambahan test untuk
`waitForVideoFrame`, readyState guard, dan fallback resolvedAddressInfo). Typecheck/lint/build
bersih. Belum di-commit — menunggu instruksi user.

## Sesi Lanjutan: Modal Foto Tidak Bisa Scroll, Simplifikasi Form Manual, HUD Watermark Tertutup Shutter

### 1. [✓] ✅ Modal "Hasil Foto Dokumentasi" tidak bisa di-scroll (portrait maupun landscape)
Root cause: `src/components/ui/Dialog.tsx` — panel modal tidak punya `max-h`/`overflow`
SAMA SEKALI (lebih parah dari bug `BottomSheet` sebelumnya yang setidaknya punya
`max-h-[85vh]` walau scroll internalnya rusak). Konten panjang (gambar + blok metadata)
bisa terpotong keluar viewport tanpa cara apa pun untuk menjangkaunya.
* Diubah: `src/components/ui/Dialog.tsx` — panel sekarang `flex flex-col max-h-[85vh]
  overflow-hidden`, header & footer tetap diam (`shrink-0`), HANYA blok `children` yang
  `overflow-y-auto flex-1 min-h-0` (pola sama seperti fix `BottomSheet` sebelumnya).
  Berlaku ke SEMUA pemakai `Dialog` (foto preview, konfirmasi hapus, dsb), tidak hanya
  modal foto.
* **NOT VERIFIED tanpa device nyata**: coba buka detail foto lalu scroll di portrait &
  landscape untuk konfirmasi.

### 2. [✓] ✅ Input manual "Nama Lokasi" & "Alamat Lengkap" dihapus — sepenuhnya otomatis dari LocationIQ
Sesuai permintaan user: karena alamat sudah di-resolve otomatis dari LocationIQ untuk
koordinat manual (sesi sebelumnya), field teks manual untuk nama lokasi/alamat jadi
redundan dan membingungkan (dua sumber kebenaran).
* Diubah: `src/features/metadata/metadata-editor-sheet.tsx` — 2 input dihapus, diganti
  panel read-only yang menampilkan hasil resolve LocationIQ langsung (dengan status
  "Mencari alamat..." saat belum ada hasil). Bagian preview watermark di bawah sheet juga
  disatukan memakai `gpsAddressInfo` (kini berlaku untuk GPS ATAU manual) alih-alih
  bercabang ke `draftManualLoc.locationName/address` yang sudah tidak ada UI-nya.
  `handleCopyFromGps` disederhanakan — hanya menyalin koordinat, alamat otomatis
  ter-resolve ulang oleh `resolveForCoordinate` di parent.
* Diubah: `src/features/metadata/use-metadata-config.ts` — `DEFAULT_MANUAL_LOCATION.
  locationName`/`.address` diubah dari teks placeholder statis ("Lokasi Dokumentasi",
  "Indonesia") jadi string kosong. **PENTING**: ini bukan kosmetik — kalau default-nya
  tidak kosong, fallback `manualLocation.locationName || resolvedAddressInfo?.locationName`
  akan SELALU menang ke default statis dan hasil resolve LocationIQ tidak akan pernah
  benar-benar terpakai di watermark (bug laten yang baru ketahuan saat menghapus UI-nya).
* Tidak mengubah `ManualLocationInput` type — field `locationName`/`address` tetap ada
  (diisi otomatis via fallback, bukan dihapus dari data model).

### 3. [✓] ✅ HUD watermark live tidak lagi ketutupan tombol shutter — diperkecil & posisi dinamis
Sesuai keputusan user (bukan dihapus, tapi diperkecil+dipindah — live preview watermark
tetap ada sesuai PRD): root cause overlap adalah HUD (`absolute bottom-4`) dan footer
kontrol kamera (`absolute bottom-0`) sama-sama positioned independen tanpa saling tahu
ukuran satu sama lain — di device dengan baris preset zoom aktif atau safe-area-inset-bottom
besar, footer jadi lebih tinggi dari asumsi dan menutupi HUD.
* Diubah: `src/features/camera/camera-screen.tsx`:
  - Tinggi footer diukur LIVE via `ResizeObserver` (`footerRef`/`footerHeight` state),
    bukan angka statis — otomatis benar walau baris preset zoom tampil/tidak atau
    safe-area berbeda antar device.
  - HUD sekarang `style={{ bottom: footerHeight + 12 }}` (posisi selalu tepat di atas
    footer, dengan transisi halus saat footer berubah tinggi).
  - Konten HUD dipangkas dari 5 baris (brand+badge, nama lokasi, alamat, koordinat+akurasi,
    waktu+timezone, catatan) jadi 2 baris (nama lokasi + tombol "Ubah"; koordinat + waktu)
    — detail lengkap tetap bisa dilihat dengan mengetuk HUD untuk buka sheet metadata.
  - Variabel `activeAddress` (sudah tidak dipakai di JSX) dan import `getLocalTimezone`
    (sudah tidak dipakai) dibersihkan.
* **NOT VERIFIED tanpa device nyata**: perlu dicoba di HP asli, terutama saat preset zoom
  tampil (kondisi yang paling mungkin membuat footer lebih tinggi dari perkiraan).

**Kualitas kode**: 122/122 test lulus (tidak ada test baru untuk sesi ini — seluruhnya
perubahan UI murni tanpa logic baru yang perlu diuji unit; behavior fallback
`resolvedAddressInfo` sudah tercakup test sesi sebelumnya). Typecheck/lint/build bersih.
Belum di-commit — menunggu instruksi user.

