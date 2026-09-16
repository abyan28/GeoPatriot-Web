import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GeoPatriot Web — GPS Camera",
  description:
    "Aplikasi kamera GPS dengan watermark lokasi dan waktu terintegrasi. Local-first, aman, dan tanpa upload foto ke server.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-black text-white`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full h-full flex flex-col bg-black text-white overflow-x-hidden"
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
