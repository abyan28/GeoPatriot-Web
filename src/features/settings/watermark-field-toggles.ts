import type { WatermarkFieldVisibility } from "@/types/watermark";

/**
 * Daftar toggle "Visibilitas Informasi Watermark". Key bertipe keyof
 * WatermarkFieldVisibility agar key yang tidak ada di tipe gagal di compile
 * (sebelumnya "gpsQuality" lolos lewat cast dan toggle-nya tidak berpengaruh).
 */
export const WATERMARK_FIELD_TOGGLES: { key: keyof WatermarkFieldVisibility; label: string }[] = [
  { key: "locationName", label: "Nama Lokasi" },
  { key: "address", label: "Alamat Lengkap" },
  { key: "coordinate", label: "Koordinat GPS" },
  { key: "date", label: "Tanggal" },
  { key: "time", label: "Jam & Menit" },
  { key: "timezone", label: "Zona Waktu" },
  { key: "accuracy", label: "Akurasi GPS" },
  { key: "altitude", label: "Ketinggian (Altitude)" },
  { key: "mapThumbnail", label: "Peta Mini" },
  { key: "customText", label: "Catatan Lapangan" },
  { key: "branding", label: "Logo & Branding" },
];
