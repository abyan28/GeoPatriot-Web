/**
 * Generator nama file unduhan yang stabil dan mudah diurutkan.
 * Lihat agents/prd-geopatriot-web.md #15: GeoPatriot_2026-09-16_08-31-12.jpg
 */

/** Membuat nama file GeoPatriot dari timestamp ISO 8601 (memakai waktu lokal browser). */
export function buildPhotoFilename(capturedAtIso: string, extension = "jpg"): string {
  const date = new Date(capturedAtIso);
  const pad = (value: number) => String(value).padStart(2, "0");

  const datePart = [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join("-");
  const timePart = [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join("-");

  return `GeoPatriot_${datePart}_${timePart}.${extension}`;
}

/** Membuat nama file ZIP untuk unduhan batch/all, berdasarkan waktu pembuatan ZIP. */
export function buildZipFilename(createdAt: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const datePart = [
    createdAt.getFullYear(),
    pad(createdAt.getMonth() + 1),
    pad(createdAt.getDate()),
  ].join("-");
  const timePart = [
    pad(createdAt.getHours()),
    pad(createdAt.getMinutes()),
    pad(createdAt.getSeconds()),
  ].join("-");
  return `GeoPatriot_Session_${datePart}_${timePart}.zip`;
}
