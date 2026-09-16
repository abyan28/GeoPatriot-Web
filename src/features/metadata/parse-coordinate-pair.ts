/**
 * Parser koordinat gabungan untuk input manual lokasi.
 * Mendukung paste langsung dari Google Maps, contoh: "-9.620308,124.879609".
 */

const COORDINATE_PAIR_PATTERN = /^\s*(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)\s*$/;

export interface CoordinatePair {
  latitude: number;
  longitude: number;
}

/**
 * Mem-parse satu string "lat,lon" (dengan separator koma, koma+spasi, atau
 * spasi) menjadi pasangan koordinat. Mengembalikan null bila format tidak
 * dikenali atau nilai di luar rentang valid (latitude ±90, longitude ±180),
 * bukan throw — supaya pemanggil (form input) bisa menampilkan pesan error
 * inline tanpa try/catch.
 */
export function parseCoordinatePair(input: string): CoordinatePair | null {
  const match = COORDINATE_PAIR_PATTERN.exec(input);
  if (!match) return null;

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90) return null;
  if (longitude < -180 || longitude > 180) return null;

  return { latitude, longitude };
}

/** Memformat pasangan koordinat menjadi string "lat,lon" untuk mengisi field gabungan. */
export function formatCoordinatePair(latitude: number, longitude: number): string {
  return `${latitude},${longitude}`;
}
