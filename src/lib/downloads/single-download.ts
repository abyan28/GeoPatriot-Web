/**
 * Download satu foto: Blob -> object URL -> trigger download browser.
 * Lihat agents/rules-geopatriot-web.md #10.1.
 *
 * DOM (document, URL.createObjectURL) di-inject lewat parameter agar fungsi
 * ini dapat diuji tanpa environment browser sungguhan.
 */

export interface DownloadEnvironment {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
  createAnchor(): { href: string; download: string; click(): void };
}

function defaultDownloadEnvironment(): DownloadEnvironment {
  return {
    createObjectURL: (blob) => URL.createObjectURL(blob),
    revokeObjectURL: (url) => URL.revokeObjectURL(url),
    createAnchor: () => document.createElement("a"),
  };
}

/**
 * Memicu download satu Blob sebagai file dengan nama tertentu.
 * Object URL langsung di-revoke setelah klik dipicu untuk mencegah memory leak.
 */
export function downloadBlob(
  blob: Blob,
  filename: string,
  env: DownloadEnvironment = defaultDownloadEnvironment(),
): void {
  const objectUrl = env.createObjectURL(blob);
  const anchor = env.createAnchor();
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  env.revokeObjectURL(objectUrl);
}
