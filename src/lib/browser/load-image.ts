/**
 * Memuat gambar dari URL (termasuk blob: URL) menjadi HTMLImageElement.
 * Dipakai untuk mengonversi object URL map thumbnail (dari MapProvider)
 * menjadi source yang bisa digambar ke Canvas (drawImage), tanpa perlu
 * fetch jaringan tambahan karena blob: URL sudah tersedia lokal di browser.
 *
 * Dibatasi timeout agar kegagalan/keterlambatan gambar tidak pernah
 * memblokir capture pipeline (rules #6.6).
 */
export function loadImageFromUrl(url: string, timeoutMs = 3000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      reject(new Error("Timeout memuat gambar."));
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error("Gagal memuat gambar."));
    };
    img.src = url;
  });
}
