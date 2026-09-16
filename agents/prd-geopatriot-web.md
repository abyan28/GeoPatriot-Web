# PRD - GeoPatriot Web

## 1. Ringkasan Produk

**GeoPatriot Web** adalah versi web dari GeoPatriot yang mempertahankan konsep utama GPS camera: mengambil foto dengan informasi lokasi dan waktu yang tertanam sebagai watermark pada foto.

Versi web tidak dibuat sebagai port langsung dari aplikasi Flutter. Arsitekturnya dirancang khusus untuk browser mobile, terutama Android Chrome dan iPhone Safari.

Prinsip utamanya adalah **local-first**: kamera, GPS, pemrosesan watermark, penyimpanan sementara, galeri sesi, dan pembuatan file unduhan dilakukan di perangkat pengguna. Vercel digunakan terutama sebagai hosting aplikasi web.

## 2. Tujuan

1. Menyediakan GPS camera yang dapat digunakan dari browser tanpa instalasi aplikasi native.
2. Memungkinkan pengguna menentukan **lokasi dan timestamp sebelum mengambil foto**.
3. Mendukung banyak foto dalam satu sesi tanpa harus mengunduh setiap foto langsung setelah pengambilan.
4. Memungkinkan pengguna meninjau, memilih, menghapus, dan mengunduh foto setelah sesi selesai.
5. Mempertahankan identitas visual dan fungsi inti GeoPatriot.
6. Meminimalkan ketergantungan terhadap backend, database, cloud storage, dan biaya operasional.

## 3. Non-Goals MVP

Fitur berikut tidak menjadi bagian MVP:

- Login dan registrasi pengguna.
- Database server.
- Upload foto ke server.
- Cloud photo storage.
- Sinkronisasi lintas perangkat.
- Analytics pengguna.
- Iklan.
- Subscription.
- Backend khusus untuk pemrosesan foto.
- Google Maps Platform.
- Scraping Google Maps.
- EXIF sebagai persyaratan utama. Penulisan EXIF dapat menjadi fase lanjutan.

## 4. Target Pengguna

Target awal adalah pengguna yang membutuhkan foto dokumentasi dengan bukti waktu dan lokasi, termasuk dokumentasi lapangan, survei, pekerjaan, perjalanan, dan kebutuhan pribadi.

Aplikasi harus tetap mudah digunakan oleh pengguna non-teknis.

## 5. Platform

### Web

- Next.js + React + TypeScript.
- Responsive/mobile-first.
- PWA.
- Hosting: Vercel Hobby untuk tahap personal/MVP. Halaman pricing Vercel saat penyusunan dokumen ini mencantumkan Hobby $0/bulan. Batas penggunaan Vercel tetap harus dipantau terhadap kebutuhan aktual. [Vercel Pricing](https://vercel.com/pricing)

### Browser capability

Kamera menggunakan `getUserMedia()`, yang membutuhkan secure context/HTTPS dan izin kamera. Vercel menyediakan HTTPS pada deployment publik. [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

Fitur Camera Zoom memanfaatkan `MediaStreamTrack.getCapabilities()` dan `applyConstraints({ advanced: [{ zoom }] })`. Kapabilitas zoom ini bergantung pada dukungan native hardware kamera dan browser engine (Media Capture Image API). [W3C Image Capture Zoom](https://w3c.github.io/mediacapture-image/#zoom)

GPS menggunakan Geolocation API, yang juga membutuhkan secure context dan izin pengguna. [MDN Geolocation](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)

## 6. Arsitektur Tingkat Tinggi

```text
User Browser
├── Camera API
├── Geolocation API
├── Canvas/Image Processing
├── IndexedDB
├── PWA Service Worker
└── ZIP/Download
        │
        ├── LocationIQ Reverse Geocoding
        └── LocationIQ Static Map

Vercel
└── Next.js application hosting
```

Tidak ada foto yang harus dikirim ke server untuk memproses watermark.

## 7. Prinsip Privacy dan Data

1. Foto diproses lokal di browser.
2. Foto tidak di-upload ke Vercel.
3. Foto disimpan sementara di IndexedDB pada perangkat pengguna.
4. Data sesi hanya tersedia pada browser/origin yang sama.
5. Pengguna diberi peringatan bahwa penyimpanan browser memiliki quota dan kebijakan eviction yang dapat berbeda antar-browser. IndexedDB memang dapat menyimpan Blob/file dan dirancang untuk penyimpanan data terstruktur dalam jumlah lebih besar daripada Web Storage biasa, tetapi kapasitas dan eviction tetap bergantung pada browser/perangkat. [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
6. Foto yang belum diunduh dianggap sebagai data sementara, bukan arsip permanen.

## 8. Mode Metadata

Lokasi dan waktu harus dapat dikontrol sebelum pengambilan foto.

### 8.1 Lokasi

- **GPS Otomatis**: ambil lokasi perangkat.
- **Lokasi Manual**: pengguna mengisi/menentukan lokasi secara manual.
- Lokasi hasil GPS dapat dilengkapi reverse geocoding.

### 8.2 Waktu

- **Otomatis**: waktu perangkat ketika foto diambil.
- **Manual**: tanggal dan waktu ditentukan pengguna sebelum pengambilan.

### 8.3 Kombinasi Mode

MVP minimal mendukung kombinasi berikut:

| Lokasi | Waktu    | Perilaku                                       |
| ------ | -------- | ---------------------------------------------- |
| GPS    | Otomatis | Lokasi dan waktu mengikuti kondisi pengambilan |
| GPS    | Manual   | GPS aktual, timestamp ditentukan pengguna      |
| Manual | Otomatis | Lokasi tetap, waktu mengikuti pengambilan      |
| Manual | Manual   | Lokasi dan waktu tetap sesuai input pengguna   |

Untuk mode GPS, capture snapshot metadata dilakukan pada saat foto dibuat. Watermark menggunakan snapshot yang sama sehingga foto dan informasi metadata tidak saling berbeda.

## 9. GPS Quality

Status akurasi ditampilkan sebagai informasi, bukan sebagai penghalang shutter:

- `< 5 m` = sangat baik
- `5-15 m` = baik
- `15-50 m` = cukup
- `> 50 m` = kurang

Jika GPS buruk atau gagal, pengguna tetap dapat mengambil foto. Aplikasi tidak boleh memaksa pengguna menunggu akurasi tertentu.

## 10. Camera Screen

Layar kamera menjadi layar utama.

### Komponen

- live camera preview
- tombol shutter utama
- switch front/rear camera bila browser/device mendukung
- kontrol camera zoom (pinch-to-zoom, tombol preset 1×/2×/dst., atau slider) jika didukung perangkat/browser
- status GPS
- status timestamp
- pengaturan lokasi
- pengaturan waktu
- pilihan template watermark
- tombol settings
- indikator jumlah foto pada sesi
- akses ke session gallery

### 10.1 Camera Zoom

GeoPatriot Web menyediakan kemampuan melakukan zoom kamera sebelum mengambil foto dokumentasi.

#### A. Prinsip Dasar
1. **Bagian dari Camera UX Asli**: Zoom kamera harus mengontrol stream video kamera nyata melalui API browser (`MediaStreamTrack.applyConstraints({ advanced: [{ zoom }] })`), bukan sekadar pembesaran preview secara visual menggunakan CSS (`transform: scale()`).
2. **Mobile-First Smartphone Focus**: Fitur dirancang terutama untuk interaksi satu tangan dan gestur sentuh smartphone.
3. **Graceful Degradation**: Zoom adalah kemampuan opsional perangkat keras/browser. Jika perangkat tidak mendukung zoom, kamera dan proses capture tetap harus berjalan normal tanpa gangguan.

#### B. Mekanisme Interaksi
Aplikasi mendukung setidaknya mekanisme zoom berikut:

1. **Pinch-to-Zoom**:
   - Pada perangkat touchscreen yang mendukung, interaksi dua jari:
     - *Two-finger pinch out* → Zoom in (memperbesar).
     - *Two-finger pinch in* → Zoom out (memperkecil).
   - Gestur harus terasa natural dan tidak memicu zoom halaman browser secara tidak sengaja (misal dengan penanganan `touch-action: none` pada kontainer viewfinder kamera).

2. **Zoom Control Presets**:
   - Kontrol tombol visual yang jelas dan mudah ditekan pada area kontrol kamera (Thumb Zone).
   - Menyediakan pilihan level zoom adaptif sesuai rentang yang dilaporkan perangkat, misalnya `1×`, `2×`, `3×` (atau nilai step terdekat).
   - Desain UI tidak boleh mengasumsikan semua perangkat memiliki level zoom yang sama. Nilai tombol disesuaikan secara dinamis dari kapabilitas perangkat (`min`, `max`, `step`).

3. **Zoom Slider**:
   - Slider kontinu sebagai pelengkap atau alternatif kontrol presisi jika implementasi UI/UX mendukung.
   - Slider **tidak boleh menjadi satu-satunya cara** melakukan zoom pada perangkat touchscreen.

#### C. Deteksi Kapabilitas Perangkat & Browser (Capability Detection)
Kemampuan zoom kamera pada browser web tidak seragam antar platform (misalnya, Android Chrome umumnya mendukung MediaStreamTrack zoom, sedangkan Safari iOS/WebKit memiliki batasan spesifik).

1. **Feature Detection Wajib**:
   - Implementasi harus memeriksa ketersediaan properti `zoom` pada kapabilitas track video:
     ```javascript
     const capabilities = track.getCapabilities?.();
     const isZoomSupported = capabilities && 'zoom' in capabilities;
     ```
   - Parameter `min`, `max`, dan `step` harus dibaca langsung dari `capabilities.zoom`.
2. **Tanpa Asumsi Keliru**:
   - Jangan mengasumsikan semua browser mendukung zoom kamera.
   - Jangan mengasumsikan semua kamera memiliki rasio 2× atau 3×.
   - Jangan mengasumsikan semua perangkat memiliki rentang zoom yang sama.
3. **Penanganan Kondisi Tidak Didukung (Unsupported)**:
   - Jika native camera zoom tidak didukung oleh browser/perangkat:
     - Kamera tetap dapat digunakan secara normal untuk mengambil foto (1×).
     - Aplikasi tidak boleh gagal, crash, atau menampilkan error yang mengganggu alur kerja.
     - Kontrol zoom (tombol/slider) disembunyikan atau dinonaktifkan secara anggun.
     - **Jangan memaksakan fake camera control** (misal memperbesar elemen CSS preview) yang memberikan ilusi palsu kepada pengguna seolah-olah kamera melakukan zoom native.

#### D. Optical Zoom vs Digital Zoom
1. **Perbedaan Teknis**:
   - *Optical Zoom*: Pembesaran optik melalui pergerakan lensa fisik atau peralihan ke kamera telefoto native.
   - *Digital Zoom*: Pembesaran melalui pemotongan (cropping) dan interpolasi digital sensor kamera.
2. **Klaim Produk yang Jujur**:
   - GeoPatriot Web **tidak menjanjikan optical zoom** kepada pengguna.
   - Aplikasi hanya mengontrol kapabilitas zoom yang diekspos secara nyata oleh browser/perangkat.
   - Jangan pernah mencantumkan klaim bahwa label `2×`, `3×`, dan seterusnya selalu berarti optical zoom. Jika perangkat hanya menyediakan digital zoom, aplikasi memanfaatkannya sesuai kapabilitas tersebut tanpa membuat klaim berlebih.

#### E. Zoom dalam Kondisi Capture (Camera State)
Tingkat zoom yang sedang aktif saat tombol shutter ditekan merupakan bagian integral dari kondisi capture:

```text
Camera State
├── Camera facing (rear/front)
├── Orientation (portrait/landscape)
├── Zoom level (e.g. 1×, 2×)
├── Location snapshot (GPS/manual)
├── Timestamp snapshot (auto/manual)
└── Watermark configuration
```

- Frame video kamera yang diekstraksi ke canvas harus merefleksikan tingkat zoom yang aktif tersebut.
- Elemen watermark (panel Deep Navy, teks alamat, koordinat, logo, dll.) tetap dirender secara proporsional di atas foto hasil zoom dengan ukuran font dan layout yang konsisten, tanpa ikut terdistorsi oleh faktor zoom foto.

### Watermark preview

Watermark ditampilkan sebagai preview yang mendekati hasil akhir.

Elemen yang dapat digunakan:

- nama lokasi
- alamat
- koordinat
- tanggal
- waktu
- timezone
- akurasi GPS
- altitude jika tersedia
- map thumbnail
- custom text
- branding GeoPatriot

Default watermark berada di bagian bawah foto dalam panel gelap semi-transparan dengan sudut membulat.

## 11. Session Photo Workflow

Pengguna tidak diwajibkan download setelah setiap foto.

```text
Start Session
     ↓
Set metadata / template
     ↓
Take photo #1
     ↓
Process + save local
     ↓
Take photo #2
     ↓
Process + save local
     ↓
        ...
     ↓
Finish Session
     ↓
Session Gallery
     ↓
Select / Preview / Delete / Download
     ↓
Download All as ZIP
```

## 12. Session Mode

Session harus mendukung setidaknya empat pola penggunaan:

1. **Fixed** - lokasi dan waktu tetap.
2. **GPS + Auto Time** - lokasi dan waktu mengikuti setiap capture.
3. **Fixed Location + Auto Time** - lokasi tetap, waktu berubah per capture.
4. **GPS + Manual Time** - GPS diperbarui, timestamp tetap/manual.

Arsitektur metadata harus cukup fleksibel untuk menangani kombinasi ini tanpa membuat alur UI rumit.

## 13. Local Storage

Gunakan IndexedDB, bukan localStorage, untuk foto dan metadata sesi.

Contoh data konsep:

```text
Session
- id
- createdAt
- mode
- watermarkTemplate
- settings

Photo
- id
- sessionId
- blob
- thumbnailBlob (opsional)
- capturedAt
- latitude
- longitude
- accuracy
- altitude
- timezone
- locationName
- address
- metadataSource
- processingStatus
```

IndexedDB harus dipakai secara asynchronous dan storage layer harus memiliki error handling untuk quota/storage failure. [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

## 14. Session Gallery

Fitur:

- daftar sesi
- jumlah foto per sesi
- preview thumbnail
- detail foto
- select satu/banyak/semua
- delete satu/banyak
- download satu
- download selected
- download all as ZIP
- clear session setelah konfirmasi

Jika ada foto yang belum di-download, UI harus memberikan indikasi yang jelas.

## 15. Download

### Single

Menghasilkan file foto final hasil watermark.

### Batch

Pengguna memilih banyak foto lalu aplikasi membuat satu ZIP di browser.

### All

Semua foto dalam sesi dimasukkan ke ZIP.

Nama file harus stabil dan mudah diurutkan, misalnya:

```text
GeoPatriot_2026-09-16_08-31-12.jpg
GeoPatriot_2026-09-16_08-32-07.jpg
```

## 16. LocationIQ

LocationIQ menjadi provider awal untuk:

- reverse geocoding
- static map/map thumbnail

Pricing saat penyusunan dokumen mencantumkan Free plan $0 dengan 5.000 request/hari dan 2 request/detik, serta geocoding dan street/static maps. Free plan juga memiliki ketentuan limited commercial use dan attribution/link yang ditentukan LocationIQ. Ketentuan provider harus ditinjau kembali sebelum deployment publik/komersial. [LocationIQ Pricing](https://locationiq.com/pricing)

API key harus dianggap sebagai credential yang terekspos bila dipakai langsung dari browser. Karena itu provider layer harus dibuat swappable.

MVP dapat menggunakan direct browser request untuk penggunaan terbatas/personal, tetapi aplikasi publik sebaiknya menyediakan server-side proxy/rate limiting sebelum skala penggunaan meningkat.

## 17. Provider Abstraction

Buat interface agar provider dapat diganti:

```text
GeocodingProvider
- reverseGeocode(lat, lon)

MapProvider
- getStaticMap(location, options)
```

Jangan menyebarkan URL/API LocationIQ langsung ke komponen UI.

Provider masa depan dapat mencakup provider geocoding/map lain atau provider satellite imagery.

## 18. Offline-First

Aplikasi harus tetap dapat:

- membuka UI yang sudah dicache PWA
- membuka kamera
- mengambil foto
- menggunakan metadata manual
- membuat watermark
- menyimpan foto lokal
- membuka session gallery
- mengunduh foto yang sudah tersimpan

Saat offline:

- reverse geocoding dapat gagal
- map thumbnail dapat gagal
- aplikasi harus tetap menyelesaikan capture
- fallback harus menampilkan koordinat/timestamp yang tersedia

## 19. PWA

MVP harus disiapkan sebagai PWA.

Target pengalaman:

1. buka website
2. browser menampilkan opsi install/add to home screen sesuai dukungan platform
3. aplikasi dapat dibuka seperti app
4. asset inti tersedia dari cache
5. penggunaan lokal tidak bergantung pada koneksi terus-menerus

PWA tidak mengubah batasan browser untuk camera/GPS dan tidak menjamin storage permanen tanpa batas.

## 20. Watermark Templates

Minimal:

- Default
- Ringkas
- Detail

Pengaturan visual harus mencakup:

- posisi
- opacity
- ukuran font
- ukuran map thumbnail
- margin
- radius
- spacing
- alignment
- visibilitas field

Attribution provider harus tetap terlihat dan tidak boleh tertutup oleh elemen watermark.

## 21. Design Direction

Identitas GeoPatriot dipertahankan, tetapi UI web harus lebih modern dan mobile-first.

Prinsip:

- fokus pada kamera
- kontrol utama mudah dijangkau ibu jari
- progressive disclosure untuk pengaturan lanjutan
- preview watermark nyata
- status GPS/timestamp selalu mudah dipahami
- tidak menggunakan dashboard yang terlalu berat
- dark camera surface agar preview foto tetap dominan
- kontrol utama tidak menghalangi framing kamera
- kontrol camera zoom berada di zona jangkauan ibu jari (Thumb Zone) dan tidak mengaburkan area framing bidik utama

## 22. Error Handling

### Camera denied

Tampilkan alasan, instruksi membuka permission browser, dan tombol coba lagi.

### Camera zoom unsupported / constraint failed

Jika perangkat atau browser tidak mendukung `MediaTrackCapabilities.zoom` atau gagal menerapkan constraint zoom:
- Kontrol zoom disembunyikan atau dinonaktifkan secara anggun (*graceful degradation*).
- Kamera dan proses capture tetap berfungsi normal pada level zoom default (1×).
- Tidak memunculkan error fatal yang menghambat alur kerja pengambilan foto.

### GPS denied

Izinkan manual location.

### GPS unavailable/poor

Tetap izinkan capture dan tampilkan status kualitas.

### Reverse geocoding failed

Gunakan fallback koordinat.

### Map failed

Hilangkan map thumbnail atau tampilkan placeholder; capture tetap sukses.

### IndexedDB quota/full

Hentikan penyimpanan foto baru dengan aman, tampilkan pesan yang jelas, dan sarankan download/hapus foto lama.

### ZIP failed

Foto individual tetap tidak boleh hilang. Pengguna dapat mencoba ulang.

## 23. Security

- HTTPS wajib untuk camera/GPS deployment.
- Jangan menyimpan API key di source code repository bila bisa dihindari.
- Jangan menganggap client-side API key sebagai secret.
- Validasi dan sanitasi semua input manual.
- Jangan menggunakan innerHTML untuk data lokasi yang tidak tepercaya.
- Tidak ada server upload foto MVP.
- CSP dan security headers dipertimbangkan pada deployment.

## 24. Accessibility

- tombol memiliki accessible label
- kontras teks mencukupi
- focus state jelas
- jangan hanya mengandalkan warna untuk status
- kontrol touch target cukup besar
- error dapat dibaca screen reader
- dialog konfirmasi memiliki keyboard/focus handling

## 25. Responsive dan Orientation

Target utama adalah smartphone portrait, tetapi aplikasi harus menangani landscape.

Camera preview dan watermark harus disesuaikan dengan orientation layar dan dimensi hasil foto, bukan hanya viewport CSS.

## 26. Acceptance Criteria MVP

### Camera

- Pengguna dapat membuka camera preview di browser HTTPS.
- Pengguna dapat mengambil foto.
- Foto asli tidak ditimpa oleh hasil watermark.
- Aplikasi mendeteksi kapabilitas zoom kamera native (`MediaStreamTrack`).
- Jika didukung: pengguna dapat mengubah zoom kamera (via pinch-to-zoom atau tombol kontrol preset/slider), dan foto hasil capture merefleksikan tingkat zoom aktif.
- Jika tidak didukung: kontrol zoom disembunyikan/dinonaktifkan secara aman tanpa memicu crash/error, dan kamera tetap dapat mengambil foto secara normal (1×).

### Metadata

- Pengguna dapat memilih lokasi GPS/manual.
- Pengguna dapat memilih waktu otomatis/manual.
- Metadata yang dipilih terlihat pada preview dan hasil akhir.

### Session

- Pengguna dapat mengambil banyak foto tanpa download satu per satu.
- Foto tersimpan ke IndexedDB.
- Foto dapat dilihat kembali setelah berpindah layar.

### Download

- Satu foto dapat diunduh.
- Foto terpilih dapat diunduh.
- Semua foto sesi dapat diunduh sebagai ZIP.

### Offline

- Capture manual tetap dapat berjalan tanpa internet setelah app siap.
- Kegagalan LocationIQ tidak menggagalkan capture.

### PWA

- Manifest dan service worker tersedia.
- Asset penting dapat dicache.

### Deployment

- Dapat dideploy ke Vercel.
- Tidak membutuhkan database/server storage untuk MVP.

## 27. Out of Scope Pasca-MVP

- login/cloud sync
- akun pengguna
- server-side photo archive
- EXIF penuh
- satellite imagery
- advanced map editing
- team workspace
- cloud sharing
- collaborative sessions
- subscription/billing

## 28. Referensi Teknis

- Vercel Pricing: https://vercel.com/pricing
- MDN getUserMedia: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- MDN Geolocation API: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
- MDN IndexedDB: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- LocationIQ Pricing: https://locationiq.com/pricing
- LocationIQ Reverse Geocoding: https://docs.locationiq.com/docs/reverse-geocoding
- LocationIQ Static Maps: https://docs.locationiq.com/docs/static-maps
- W3C Image Capture Zoom: https://w3c.github.io/mediacapture-image/#zoom
- MDN MediaTrackConstraints.zoom: https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/zoom

## 29. Pedoman Pengerjaan AI (Tasklist Rules)

Setiap kali selesai mengerjakan satu tugas/fitur, AI wajib memperbarui file `agents/tasklist.md` sebelum melaporkan hasil pengerjaan kepada user dengan ketentuan:

1. Tandai task yang selesai dengan centang `[✓]`.
2. Tambahkan emoji ✅ di depan task.
3. Update progress keseluruhan proyek (misal: `Progress: 35%`).
4. Tambahkan catatan singkat di bawah task mengenai file apa saja yang dibuat/diubah.
   _Contoh:_
   ```markdown
   - [✓] ✅ Task 2.3 - Membuat Room Migration `[Mudah]` (Selesai)
     - Membuat file `database/migrations/xxxx_create_students_table.php`
   ```
5. update tasklist.md setiap selesai 1 task.
6. kasih summary jelas di akhir setiap task.
7. kalau mulai limit, berhenti di check point yg rapi
8. jadi nanti next agent tinggal baca task list dan tahu tepat mana yang dilanjut.

## 30. Pedoman Penulisan Coding/Pengerjaan Sistem

- Berikan komentar dengan bahasa Indonesia untuk setiap fungsi kodingan yg dibuat, sehingga memudahkan programmer untuk memahami kodingannya.

- ANTISLOP Skills

  - Seluruh pengerjaan sistem, implementasi, UI, UX, serta teks yang ditampilkan pada antarmuka WAJIB mengikuti aturan ANTISLOP SKILLS yang tersedia dan telah terpasang pada environment AI agent yang digunakan.
  - Agent WAJIB membaca dan menerapkan skill ANTISLOP SKILLS yang relevan terhadap pekerjaan yang sedang dilakukan sebelum menghasilkan atau memodifikasi output. Jangan menduplikasi isi aturan ANTISLOP ke dalam PRD atau rules ini; gunakan skill yang terpasang sebagai sumber aturan yang berlaku.
  - Aturan ini berlaku lintas AI coding agent, termasuk OpenCode, Claude Code, Antigravity, Codex, Cursor, Gemini CLI, Hermes, dan agent lain yang mendukung Agent Skills.
  - Jika terdapat konflik antara instruksi proyek dengan aturan ANTISLOP, ikuti aturan yang memiliki prioritas lebih tinggi sesuai instruction hierarchy, tetapi jangan mengabaikan ANTISLOP hanya karena output secara teknis sudah berfungsi.
  - Untuk pekerjaan yang berkaitan dengan:
    - UI/visual → terapkan antislop-ui
    - Copywriting/teks → terapkan antislop-copywriting
    - Accessibility/human factors → terapkan antislop-human
    - Responsive/mobile layout → terapkan antislop-layoutmobile
    - Code comments → terapkan antislop-code
    - Pekerjaan umum → terapkan core antislop
  - Sebelum delivery, output harus melewati ANTISLOP Delivery Gate dan tidak boleh dikirim sebagai hasil final apabila masih melanggar aturan yang relevan.
