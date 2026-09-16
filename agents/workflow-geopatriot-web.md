# Workflow - GeoPatriot Web

## 1. Development Strategy

Development dilakukan bertahap dari fondasi browser dan camera sampai session gallery, download, PWA, lalu polish.

Urutan harus menjaga agar setiap tahap menghasilkan sistem yang dapat dijalankan dan diuji.

## 2. Phase 0 - Repository dan Baseline

### Tujuan

Menyiapkan repository web tanpa mengubah repository Flutter secara sembrono.

### Langkah

1. Buat project Next.js + TypeScript.
2. Gunakan App Router.
3. Tambahkan linting/formatting.
4. Buat struktur feature-oriented.
5. Dokumentasikan environment variables.
6. Jalankan lokal.
7. Commit baseline.
8. Hubungkan repository ke Vercel.

### Struktur awal

```text
src/
  app/
  components/
  features/
    camera/
    location/
    metadata/
    watermark/
    sessions/
    downloads/
    settings/
  lib/
    providers/
    storage/
    image/
    browser/
  types/
public/
```

## 3. Phase 1 - App Shell dan Design System

### Output

- layout mobile-first
- theme
- typography
- buttons
- cards
- dialogs
- bottom sheets
- status chips
- toast
- loading state
- empty state

### Test

- portrait mobile
- landscape mobile
- desktop fallback

## 4. Phase 2 - Camera Proof of Concept

### Tujuan

Memastikan browser benar-benar dapat mengakses kamera dan mendeteksi kapabilitas perangkat termasuk camera zoom.

### Implementasi

1. Gunakan `navigator.mediaDevices.getUserMedia()`.
2. Camera permission hanya diminta saat user memasuki fitur kamera atau menekan aksi yang membutuhkan kamera.
3. Deteksi kapabilitas zoom kamera native via `track.getCapabilities()`:
   - Periksa keberadaan properti `zoom`.
   - Baca parameter `min`, `max`, dan `step` bila tersedia.
4. Terapkan zoom constraints via `track.applyConstraints({ advanced: [{ zoom }] })`.
5. Siapkan interaksi pinch-to-zoom dan kontrol tombol preset/slider dengan fallback anggun (*graceful degradation*) bila zoom tidak didukung.

### Acceptance

- preview tampil
- rear camera dapat dipilih bila tersedia
- kapabilitas zoom kamera terdeteksi secara dinamis
- zoom berfungsi mengontrol stream kamera (via pinch atau tombol) bila didukung
- perangkat tanpa dukungan zoom tetap dapat menggunakan kamera secara normal (1×) tanpa error
- kamera dapat dihentikan
- permission denied ditangani
- HTTPS deployment berhasil

## 5. Phase 3 - Geolocation

### Implementasi

Gunakan `navigator.geolocation`.

Simpan:

```text
latitude
longitude
accuracy
altitude?
timestamp
```

### Status

Hitung kategori kualitas:

```text
<5m
5-15m
15-50m
>50m
```

### Acceptance

- user melihat status GPS
- GPS gagal tidak memblokir camera
- manual location tersedia sebagai fallback

## 6. Phase 4 - Metadata Editor

Buat komponen konfigurasi:

```text
Location Mode
[ GPS ] [ Manual ]

Time Mode
[ Auto ] [ Manual ]
```

### Manual Location

Minimal mendukung:

- latitude
- longitude
- nama lokasi
- alamat opsional

Bila memungkinkan, sediakan pencarian lokasi melalui provider.

### Manual Time

- date picker
- time picker
- timezone display

### Aturan

Metadata yang sedang aktif harus selalu terlihat di camera screen.

## 7. Phase 5 - Capture Pipeline

Alur satu foto:

```text
Press shutter
   ↓
Freeze Camera State & Metadata snapshot
(facing, orientation, zoom level, location, timestamp)
   ↓
Capture frame from video stream
(frame mencerminkan tingkat pembesaran zoom aktif)
   ↓
Load image to Canvas
   ↓
Render watermark on Canvas
(watermark digambar proporsional di atas foto hasil zoom)
   ↓
Export processed Blob
   ↓
Store locally (IndexedDB)
   ↓
Update session gallery
```

### Camera State saat Capture

Zoom yang sedang aktif ketika tombol shutter ditekan merupakan bagian dari kondisi capture:

```text
Camera State
├── Camera facing (rear / front)
├── Orientation (portrait / landscape)
├── Zoom level (e.g. 1×, 2×, 3×)
├── Location snapshot (GPS / manual)
├── Timestamp snapshot (auto / manual)
└── Watermark configuration (template, layout, fields)
```

Penting:
1. Metadata snapshot dan zoom level dibekukan sekali untuk setiap kali capture dipicu.
2. Watermark dirender di atas frame hasil capture tanpa mengubah ukuran font maupun proporsi elemen watermark akibat faktor zoom kamera.

## 8. Phase 6 - Watermark Engine

Watermark engine harus menerima data terstruktur, bukan mengambil state UI secara langsung.

Contoh:

```text
WatermarkData
- locationName
- address
- latitude
- longitude
- date
- time
- timezone
- accuracy
- altitude
- mapImage
- customText
```

Template:

```text
Default
Ringkas
Detail
```

Engine harus dapat menghasilkan output dengan berbagai ukuran foto.

## 9. Phase 7 - LocationIQ Integration

Implementasikan provider interface terlebih dahulu.

```text
GeocodingProvider
MapProvider
```

Kemudian implementasikan LocationIQ.

### Reverse geocoding flow

```text
GPS/manual coordinate
        ↓
GeocodingProvider
        ↓
LocationIQ
        ↓
location name + address
```

### Map flow

```text
coordinate
   ↓
MapProvider
   ↓
LocationIQ static map
   ↓
thumbnail
```

Kegagalan kedua layanan harus non-fatal terhadap capture.

## 10. Phase 8 - IndexedDB Storage

Buat repository abstraction:

```text
SessionRepository
PhotoRepository
SettingsRepository
```

Jangan biarkan komponen UI berinteraksi langsung dengan IndexedDB.

### Data lifecycle

```text
create session
   ↓
add photo
   ↓
read/update photo
   ↓
delete photo
   ↓
finish session
   ↓
clear session
```

## 11. Phase 9 - Multi-photo Session

Camera screen menampilkan:

```text
Session: 12 photos
```

Setelah foto diambil:

- simpan otomatis
- jangan memaksa download
- tetap berada di camera
- user bisa melanjutkan capture

### Session metadata

Simpan mode yang dipilih saat session dibuat.

Metadata per photo tetap disimpan agar session tidak bergantung pada current UI state.

## 12. Phase 10 - Session Gallery

Halaman:

```text
Sessions
  ↓
Session Detail
  ↓
Grid Photos
```

Setiap thumbnail memiliki:

- checkbox/select
- preview
- status

Toolbar:

- Select All
- Download
- Delete

## 13. Phase 11 - Download Engine

### Single

Blob -> object URL -> browser download.

### Multiple

```text
Selected photos
   ↓
Generate ZIP
   ↓
Browser download
```

Gunakan library ZIP client-side jika diperlukan.

ZIP failure tidak boleh menghapus data lokal.

## 14. Phase 12 - PWA

Implementasikan:

- Web App Manifest
- service worker
- cache strategy
- offline app shell
- install/add-to-home-screen metadata

Jangan cache response yang berpotensi menyimpan data lokasi pengguna secara tidak aman tanpa alasan.

## 15. Phase 13 - Settings

Settings minimal:

### Watermark

- template
- position
- opacity
- font size
- thumbnail size
- visible fields
- custom text

### Location

- provider
- GPS behavior
- fallback behavior

### Storage

- storage usage indicator bila tersedia
- clear downloaded/old sessions
- clear all local data

## 16. Phase 14 - Error/Permission UX

Buat state eksplisit:

```text
camera_idle
camera_requesting
camera_ready
camera_denied
camera_error
camera_zoom_supported
camera_zoom_unsupported
camera_zoom_error

gps_idle
gps_searching
gps_ready
gps_denied
gps_error

geocoding_loading
geocoding_success
geocoding_error

map_loading
map_success
map_error

storage_ok
storage_warning
storage_full
```

Semua service error harus mempunyai fallback yang jelas. Kegagalan atau ketiadaan dukungan zoom kamera tidak boleh menghentikan kesiapan kamera (`camera_ready`) dan hanya menonaktifkan/menyembunyikan kontrol zoom.

## 17. Phase 15 - iPhone Safari Testing

Prioritas karena salah satu tujuan web adalah menghindari workflow Mac/TestFlight.

Uji minimal:

- camera permission
- location permission
- front/rear camera
- camera zoom capability detection (perilaku WebKit Safari iOS)
- pinch-to-zoom vs browser page zoom gesture handling (touch-action)
- graceful fallback saat zoom constraints tidak didukung di Safari
- orientation portrait
- orientation landscape
- camera capture
- canvas output
- IndexedDB
- download single photo
- download ZIP
- Add to Home Screen/PWA behavior
- reload after session
- browser background/resume

## 18. Phase 16 - Android Chrome Testing

Uji minimal:

- permission flow
- camera switching
- camera native zoom capability (min, max, step pada kamera belakang/depan)
- pinch-to-zoom gesture fluency
- preset zoom switching (1×, 2×, dst.)
- capture frame output matching preview zoom level
- GPS accuracy
- capture
- storage
- ZIP
- PWA install
- orientation

## 19. Phase 17 - Performance Testing

Test dengan:

- 10 foto
- 25 foto
- 50 foto
- 100 foto bila perangkat memungkinkan

Ukur:

- time to capture
- processing latency
- IndexedDB write time
- gallery loading
- ZIP generation time
- memory pressure

## 20. Phase 18 - Vercel Deployment

### Preview

Push branch → Vercel preview deployment.

### Production

Merge stable branch → production deployment.

### Environment variables

Gunakan environment variable untuk konfigurasi provider.

Catatan: environment variable yang dikirim ke client bundle bukan secret. Jangan memasukkan credential yang harus benar-benar rahasia ke client.

## 21. Phase 19 - Release Checklist

### Functional

- camera
- camera zoom (capability detection, pinch-to-zoom, preset/slider controls, capture state sync, unsupported fallback)
- GPS
- manual location
- manual timestamp
- watermark
- sessions
- gallery
- download
- ZIP
- offline fallback
- PWA

### Privacy

- no photo upload
- clear local data option
- permission explanations
- LocationIQ attribution

### Compatibility

- Android Chrome
- iPhone Safari
- desktop Chrome/Edge untuk fallback/testing

### Deployment

- Vercel production
- HTTPS
- environment variables
- monitoring error dasar

## 22. Git Workflow

Gunakan branch fitur agar pekerjaan AI agent mudah direview.

Contoh:

```text
main
├── feat/web-shell
├── feat/camera
├── feat/location
├── feat/watermark
├── feat/storage
├── feat/session-gallery
└── feat/pwa
```

Setiap fase sebaiknya:

1. memiliki tujuan jelas
2. diuji
3. commit terpisah
4. baru dilanjutkan ke fase berikutnya

## 23. Definition of Done

Sebuah fitur selesai bila:

- implementasi selesai
- lint/typecheck lulus
- unit test yang relevan lulus
- manual test pada browser target dilakukan
- error state diuji
- tidak merusak offline/local-first workflow
- perubahan didokumentasikan bila memengaruhi arsitektur
