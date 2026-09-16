# Rules - GeoPatriot Web

## 1. Product Rules

1. GeoPatriot Web adalah web-first, mobile-first, local-first.
2. Jangan mengubah produk menjadi sistem SaaS/cloud photo manager tanpa keputusan baru.
3. Tidak ada login/database/cloud storage pada MVP.
4. Foto tidak di-upload ke Vercel pada MVP.
5. Pengguna harus dapat mengambil banyak foto dalam satu session tanpa dipaksa mengunduh satu per satu.

## 2. Architecture Rules

1. Gunakan Next.js + React + TypeScript.
2. Gunakan App Router kecuali ada alasan teknis yang terdokumentasi untuk berbeda.
3. Pisahkan UI, domain logic, provider, storage, dan image processing.
4. Komponen UI tidak boleh memanggil IndexedDB secara langsung.
5. Komponen UI tidak boleh memanggil URL LocationIQ secara langsung.
6. Gunakan interface/provider abstraction untuk geocoding dan map.
7. Jangan membuat dependency ke Google Maps Platform pada MVP.
8. Jangan scraping Google Maps.
9. Semua pemrosesan foto utama dilakukan client-side.

## 3. Camera Rules

1. Kamera menggunakan browser Media Capture API.
2. Jangan meminta permission camera sebelum benar-benar diperlukan.
3. Tangani permission denied secara eksplisit.
4. Jangan menganggap semua browser mendukung semua camera capability.
5. Jangan menaruh kontrol besar di atas area framing foto.
6. Capture harus tetap memungkinkan ketika metadata eksternal seperti reverse geocoding/map gagal.

## 4. Location Rules

1. Geolocation menggunakan browser Geolocation API.
2. HTTPS wajib pada deployment publik karena camera dan geolocation membutuhkan secure context. [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) [MDN Geolocation](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
3. Pengguna harus memberikan izin secara eksplisit.
4. Jangan memblokir shutter karena akurasi GPS rendah.
5. Selalu simpan accuracy bila tersedia.
6. Tampilkan status kualitas GPS secara informatif.
7. Sediakan manual location sebagai fallback.
8. Jangan menyatakan koordinat sebagai pasti bila sumbernya memiliki error/accuracy yang signifikan.

## 5. Metadata Rules

1. Metadata harus dibekukan per capture.
2. Watermark harus menggunakan snapshot metadata yang sama dengan foto tersebut.
3. Jangan mengambil timestamp dari state UI setelah foto selesai diproses jika snapshot sebelumnya sudah dibuat.
4. Mode manual harus benar-benar menggunakan nilai yang dimasukkan pengguna.
5. Mode otomatis menggunakan waktu perangkat/browser pada saat capture.
6. Simpan timezone yang digunakan pada metadata.

## 6. Watermark Rules

1. Watermark adalah hasil rendering, bukan overlay HTML yang hanya terlihat di UI.
2. Hasil akhir harus berupa image Blob/file yang dapat diunduh.
3. Template tidak boleh mengubah metadata sumber.
4. Map thumbnail dan attribution harus diperlakukan sebagai elemen terpisah.
5. Attribution provider tidak boleh ditutup oleh watermark lain.
6. Jika map gagal, foto tetap dibuat.
7. Jika alamat gagal, gunakan koordinat sebagai fallback.
8. Jangan menghilangkan informasi yang dipilih pengguna hanya karena salah satu service gagal.

## 7. Image Processing Rules

1. Foto asli dan foto hasil watermark adalah objek berbeda.
2. Jangan overwrite original capture.
3. Gunakan Canvas/ImageBitmap atau API browser yang sesuai.
4. Perhatikan orientation dan aspect ratio foto asli.
5. Jangan mengandalkan ukuran viewport sebagai ukuran gambar hasil.
6. Berikan batas ukuran output untuk mencegah penggunaan memori berlebihan.
7. Tangani kegagalan `toBlob()`/encoding secara eksplisit.

## 8. Storage Rules

1. Gunakan IndexedDB untuk foto/session.
2. Jangan gunakan localStorage untuk Blob foto.
3. Storage layer wajib asynchronous.
4. Semua operasi storage harus memiliki error handling.
5. Jangan menjanjikan bahwa foto lokal tersimpan selamanya.
6. Tampilkan peringatan bila storage mendekati batas atau gagal ditulis.
7. Pengguna harus dapat menghapus session/foto secara manual.
8. Jangan menghapus foto otomatis tanpa aturan UX yang jelas dan konfirmasi bila berisiko kehilangan data.

IndexedDB memang mendukung data terstruktur termasuk Blob/file, tetapi quota dan eviction berbeda antar-browser. [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

## 9. Session Rules

1. Session adalah unit kerja untuk banyak foto.
2. Setiap foto memiliki metadata snapshot sendiri.
3. Perubahan settings setelah foto pertama tidak boleh mengubah foto lama.
4. Session dapat tetap aktif setelah beberapa foto.
5. Selesai mengambil foto tidak berarti session otomatis dihapus.
6. Download tidak boleh menghapus foto lokal kecuali pengguna memilih cleanup.

## 10. Download Rules

1. Single download harus tersedia.
2. Batch selection download harus tersedia.
3. Download All harus tersedia untuk session.
4. Batch download menggunakan ZIP client-side.
5. Kegagalan ZIP tidak boleh menghapus sumber foto.
6. File naming harus konsisten dan sortable.
7. Jangan bergantung pada server untuk menggabungkan ZIP pada MVP.

## 11. Offline Rules

1. Capture tidak boleh bergantung pada keberhasilan internet.
2. Manual timestamp/location harus bekerja offline.
3. Existing local photos harus dapat dibuka tanpa internet.
4. Existing local photos harus dapat diunduh tanpa internet.
5. Reverse geocoding yang gagal menjadi fallback, bukan fatal error.
6. Map yang gagal menjadi fallback, bukan fatal error.
7. Jangan tampilkan UI yang membuat user mengira foto hilang hanya karena provider offline.

## 12. Provider Rules

1. Semua provider eksternal dibungkus interface.
2. LocationIQ adalah provider awal, bukan hard-coded architecture.
3. Direct browser requests harus dianggap public/observable.
4. API key client-side tidak dianggap secret.
5. Jika aplikasi dibuka untuk publik dalam skala lebih tinggi, evaluasi proxy/server-side rate limiting.
6. Provider limits dan attribution harus dipatuhi.
7. LocationIQ Free plan saat ini mencantumkan 5.000 request/hari, 2 request/detik, serta ketentuan limited commercial use dan attribution/link; jangan mengasumsikan angka atau syarat tersebut tidak berubah. [LocationIQ Pricing](https://locationiq.com/pricing)

## 13. Vercel Rules

1. Vercel digunakan sebagai hosting/deployment layer.
2. Jangan menambahkan database/server storage hanya karena aplikasi berada di Vercel.
3. Gunakan environment variables untuk configuration.
4. Jangan menganggap variable yang masuk client bundle sebagai secret.
5. Pertahankan aplikasi agar tetap dapat berjalan tanpa Vercel-specific API selama tidak diperlukan.
6. Vercel Hobby adalah target hosting MVP/personal; pricing dan usage limits harus diverifikasi saat deployment. [Vercel Pricing](https://vercel.com/pricing)

## 14. PWA Rules

1. PWA adalah enhancement, bukan pengganti browser capability.
2. Service worker hanya cache asset/response yang aman.
3. Jangan menyimpan data lokasi pribadi ke cache HTTP secara sembarangan.
4. Offline app shell harus dapat dibuka.
5. PWA install prompt behavior dapat berbeda antar platform; jangan membuat fitur bergantung pada prompt tersebut.

## 15. Mobile UX Rules

1. Mobile portrait adalah prioritas utama.
2. Touch target harus nyaman.
3. Kontrol shutter harus mudah dijangkau.
4. Pengaturan lanjutan menggunakan progressive disclosure.
5. Jangan memenuhi layar kamera dengan panel konfigurasi.
6. Preview watermark harus tersedia sebelum shutter.
7. Orientation landscape harus diuji.
8. Jangan menganggap perilaku Safari sama dengan Chrome Android.

## 16. Accessibility Rules

1. Setiap icon-only button memiliki accessible name.
2. Jangan mengandalkan warna saja untuk status.
3. Dialog memiliki focus management.
4. Form error dikaitkan dengan field terkait.
5. Keyboard navigation tetap masuk akal pada desktop.
6. Text contrast harus memenuhi standar aksesibilitas yang relevan.

## 17. Security Rules

1. Semua deployment produksi menggunakan HTTPS.
2. Jangan menyimpan secret dalam source code.
3. Jangan memasukkan API secret ke browser bundle.
4. Validasi input manual.
5. Escape/render data lokasi sebagai text, bukan raw HTML.
6. Gunakan security headers yang relevan.
7. Hindari third-party script yang tidak diperlukan.
8. Jangan mengirim foto/lokasi ke server tanpa fitur dan persetujuan yang jelas.

## 18. Error Handling Rules

Setiap service harus mempunyai tiga hasil minimal:

```text
loading
success
failure/fallback
```

Failure pada fitur tambahan tidak boleh merusak core capture flow.

Contoh:

```text
LocationIQ down
      ↓
map unavailable
      ↓
coordinates remain
      ↓
photo still saved
```

## 19. Testing Rules

Minimal test pada:

- Android Chrome
- iPhone Safari
- desktop Chrome/Edge

Wajib diuji:

- camera permission
- GPS permission
- manual metadata
- capture
- orientation
- watermark
- IndexedDB
- multiple photos
- gallery
- single download
- ZIP download
- offline fallback
- PWA

Test batch storage dengan setidaknya:

```text
10 photos
25 photos
50 photos
```

## 20. Code Quality Rules

1. TypeScript strict mode.
2. Hindari `any` kecuali ada alasan yang terdokumentasi.
3. Domain types tidak boleh bergantung langsung pada component state.
4. Utility yang dipakai lintas feature harus ditempatkan di layer bersama.
5. Jangan membuat file god-object.
6. Satu module harus memiliki tanggung jawab yang jelas.
7. Error harus typed/structured bila memungkinkan.
8. Jangan menduplikasi business rule di banyak komponen.

## 21. AI Agent Rules

Saat menggunakan Claude/Gemini/agent coding:

1. Agent wajib membaca PRD, workflow, dan rules sebelum mengubah kode.
2. Agent harus memeriksa repository aktual sebelum menyimpulkan struktur.
3. Agent tidak boleh mengganti arsitektur tanpa alasan dan persetujuan.
4. Agent harus menyelesaikan satu phase/task dalam satu perubahan terkontrol.
5. Agent harus menjalankan lint/typecheck/test yang relevan setelah perubahan.
6. Agent harus menjelaskan file yang diubah.
7. Agent tidak boleh menghapus fitur existing GeoPatriot Web tanpa alasan.
8. Agent tidak boleh menambahkan backend/database hanya untuk mempermudah implementasi lokal.
9. Agent harus mempertahankan local-first principle.
10. Agent harus memperlakukan data foto/lokasi sebagai data sensitif dari sisi privacy.

## 22. Git Rules

1. `main` harus tetap deployable.
2. Gunakan feature branch untuk pekerjaan besar.
3. Commit harus memiliki scope yang jelas.
4. Jangan mencampur refactor besar dengan feature yang tidak berkaitan.
5. Sebelum merge, lakukan lint/typecheck/test dan smoke test.

## 23. Documentation Rules

Perubahan berikut wajib memperbarui dokumentasi bila relevan:

- architecture
- storage model
- provider
- permissions
- deployment
- environment variables
- data/privacy behavior

## 24. Non-Negotiable UX Principle

**Core capture must remain available even when optional services fail.**

Contoh:

```text
No internet        -> capture masih bisa
No reverse geocode -> capture masih bisa
No map             -> capture masih bisa
GPS denied         -> manual location masih bisa
Poor GPS accuracy  -> capture masih bisa
```

Tujuan utama aplikasi adalah mengambil dan menghasilkan foto terdokumentasi; layanan tambahan tidak boleh menjadi single point of failure.
