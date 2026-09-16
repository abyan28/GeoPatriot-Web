import type { NextConfig } from "next";
import os from "node:os";

/**
 * Mengambil daftar alamat IP lokal perangkat ini agar Next.js dev server mengizinkan
 * akses dev resources (HMR, font, chunk JS) saat diuji via smartphone di jaringan Wi-Fi lokal.
 */
function getLocalDevOrigins(): string[] {
  const origins = new Set<string>(["localhost"]);
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === "IPv4" && !iface.internal) {
          origins.add(iface.address);
        }
      }
    }
  } catch {
    // Abaikan jika interfaces tidak dapat dibaca
  }
  return Array.from(origins);
}

/**
 * Content-Security-Policy produksi (audit finding F-03).
 * 'unsafe-inline' pada script-src WAJIB dipertahankan karena Next.js App
 * Router menyisipkan inline <script> untuk RSC streaming payload
 * (`self.__next_f.push(...)`) — tanpa itu aplikasi akan blank/error di
 * production. Perlindungan utama CSP ini ada pada connect-src: fetch/XHR
 * hanya diizinkan ke origin sendiri + LocationIQ, sehingga exfiltrasi data
 * ke domain lain (bila suatu saat terjadi XSS) tetap terblokir browser.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' data:",
  "connect-src 'self' https://us1.locationiq.com https://maps.locationiq.com",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  allowedDevOrigins: getLocalDevOrigins(),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), geolocation=(self), microphone=()",
          },
          {
            key: "Content-Security-Policy",
            value: CONTENT_SECURITY_POLICY,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
