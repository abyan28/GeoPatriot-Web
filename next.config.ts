import type { NextConfig } from "next";
import os from "node:os";

/**
 * Mengambil daftar alamat IP lokal perangkat ini agar Next.js dev server mengizinkan
 * akses dev resources (HMR, font, chunk JS) saat diuji via smartphone di jaringan Wi-Fi lokal.
 */
function getLocalDevOrigins(): string[] {
  const origins = new Set<string>(["localhost", "192.168.100.10"]);
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
        ],
      },
    ];
  },
};

export default nextConfig;
