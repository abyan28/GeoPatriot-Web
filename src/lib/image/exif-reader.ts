/**
 * Pembaca EXIF minimal untuk JPEG: hanya mengambil waktu pemotretan dan koordinat GPS.
 * Dipakai untuk pre-fill form upload; kegagalan/ketiadaan EXIF tidak pernah fatal
 * (foto hasil kirim WhatsApp dsb. biasanya sudah ter-strip), user cukup mengisi manual.
 */

export interface ExifMetadata {
  /** Waktu pemotretan format "YYYY-MM-DDTHH:mm" (siap untuk input datetime-local). */
  capturedAtLocal?: string;
  latitude?: number;
  longitude?: number;
}

const TAG_EXIF_IFD = 0x8769;
const TAG_GPS_IFD = 0x8825;
const TAG_DATETIME_ORIGINAL = 0x9003;
const TAG_DATETIME = 0x0132;
const TAG_GPS_LAT_REF = 0x0001;
const TAG_GPS_LAT = 0x0002;
const TAG_GPS_LON_REF = 0x0003;
const TAG_GPS_LON = 0x0004;

/** Ukuran byte per tipe TIFF: BYTE, ASCII, SHORT, LONG, RATIONAL. */
const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8 };

/** Hanya 128 KB pertama file yang dibaca: APP1/EXIF selalu berada di awal JPEG. */
const EXIF_READ_LIMIT_BYTES = 128 * 1024;

interface IfdEntry {
  type: number;
  count: number;
  /** Offset (relatif awal TIFF) tempat nilai sebenarnya berada. */
  valueOffset: number;
}

function readIfd(
  view: DataView,
  tiffStart: number,
  ifdOffset: number,
  little: boolean,
): Map<number, IfdEntry> {
  const entries = new Map<number, IfdEntry>();
  const base = tiffStart + ifdOffset;
  if (base + 2 > view.byteLength) return entries;
  const count = view.getUint16(base, little);

  for (let i = 0; i < count; i++) {
    const entryStart = base + 2 + i * 12;
    if (entryStart + 12 > view.byteLength) break;
    const tag = view.getUint16(entryStart, little);
    const type = view.getUint16(entryStart + 2, little);
    const valueCount = view.getUint32(entryStart + 4, little);
    const size = (TYPE_SIZE[type] ?? 0) * valueCount;
    // Nilai <= 4 byte disimpan langsung di dalam entry, selebihnya lewat offset.
    const valueOffset =
      size <= 4 ? entryStart + 8 - tiffStart : view.getUint32(entryStart + 8, little);
    entries.set(tag, { type, count: valueCount, valueOffset });
  }
  return entries;
}

function readAscii(view: DataView, tiffStart: number, entry: IfdEntry): string {
  let text = "";
  for (let i = 0; i < entry.count; i++) {
    const pos = tiffStart + entry.valueOffset + i;
    if (pos >= view.byteLength) break;
    const code = view.getUint8(pos);
    if (code === 0) break;
    text += String.fromCharCode(code);
  }
  return text;
}

function readRationals(
  view: DataView,
  tiffStart: number,
  entry: IfdEntry,
  little: boolean,
): number[] {
  const values: number[] = [];
  for (let i = 0; i < entry.count; i++) {
    const pos = tiffStart + entry.valueOffset + i * 8;
    if (pos + 8 > view.byteLength) break;
    const numerator = view.getUint32(pos, little);
    const denominator = view.getUint32(pos + 4, little);
    values.push(denominator === 0 ? 0 : numerator / denominator);
  }
  return values;
}

function dmsToDecimal(dms: number[], ref: string): number | undefined {
  if (dms.length < 3) return undefined;
  const decimal = dms[0] + dms[1] / 60 + dms[2] / 3600;
  if (!Number.isFinite(decimal)) return undefined;
  return ref === "S" || ref === "W" ? -decimal : decimal;
}

/** "2024:05:17 14:03:09" -> "2024-05-17T14:03". Mengembalikan undefined bila format tidak valid. */
function exifDateToLocalInput(raw: string): string | undefined {
  const match = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2})/.exec(raw);
  if (!match || match[1] === "0000") return undefined;
  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}`;
}

/** Mem-parse EXIF dari buffer awal sebuah file JPEG. Tidak pernah throw. */
export function parseExifFromBuffer(buffer: ArrayBuffer): ExifMetadata {
  const result: ExifMetadata = {};
  try {
    const view = new DataView(buffer);
    if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return result;

    // Cari segmen APP1 yang berisi "Exif\0\0".
    let offset = 2;
    let tiffStart = -1;
    while (offset + 4 <= view.byteLength) {
      if (view.getUint8(offset) !== 0xff) break;
      const marker = view.getUint8(offset + 1);
      if (marker === 0xda || marker === 0xd9) break; // SOS / EOI: tidak ada lagi metadata
      const segmentLength = view.getUint16(offset + 2);
      if (
        marker === 0xe1 &&
        offset + 10 <= view.byteLength &&
        view.getUint32(offset + 4) === 0x45786966 // "Exif"
      ) {
        tiffStart = offset + 10;
        break;
      }
      offset += 2 + segmentLength;
    }
    if (tiffStart < 0 || tiffStart + 8 > view.byteLength) return result;

    const byteOrder = view.getUint16(tiffStart);
    if (byteOrder !== 0x4949 && byteOrder !== 0x4d4d) return result;
    const little = byteOrder === 0x4949;

    const ifd0 = readIfd(view, tiffStart, view.getUint32(tiffStart + 4, little), little);

    const exifPointer = ifd0.get(TAG_EXIF_IFD);
    let rawDate: string | undefined;
    if (exifPointer) {
      const exifIfd = readIfd(
        view,
        tiffStart,
        view.getUint32(tiffStart + exifPointer.valueOffset, little),
        little,
      );
      const original = exifIfd.get(TAG_DATETIME_ORIGINAL);
      if (original) rawDate = readAscii(view, tiffStart, original);
    }
    if (!rawDate) {
      const modified = ifd0.get(TAG_DATETIME);
      if (modified) rawDate = readAscii(view, tiffStart, modified);
    }
    if (rawDate) result.capturedAtLocal = exifDateToLocalInput(rawDate);

    const gpsPointer = ifd0.get(TAG_GPS_IFD);
    if (gpsPointer) {
      const gpsIfd = readIfd(
        view,
        tiffStart,
        view.getUint32(tiffStart + gpsPointer.valueOffset, little),
        little,
      );
      const latRef = gpsIfd.get(TAG_GPS_LAT_REF);
      const lat = gpsIfd.get(TAG_GPS_LAT);
      const lonRef = gpsIfd.get(TAG_GPS_LON_REF);
      const lon = gpsIfd.get(TAG_GPS_LON);
      if (latRef && lat && lonRef && lon) {
        const latitude = dmsToDecimal(
          readRationals(view, tiffStart, lat, little),
          readAscii(view, tiffStart, latRef),
        );
        const longitude = dmsToDecimal(
          readRationals(view, tiffStart, lon, little),
          readAscii(view, tiffStart, lonRef),
        );
        // (0,0) hampir selalu berarti GPS kosong/belum fix, bukan lokasi nyata.
        if (
          latitude !== undefined &&
          longitude !== undefined &&
          Math.abs(latitude) <= 90 &&
          Math.abs(longitude) <= 180 &&
          !(latitude === 0 && longitude === 0)
        ) {
          result.latitude = Number(latitude.toFixed(6));
          result.longitude = Number(longitude.toFixed(6));
        }
      }
    }
  } catch {
    // EXIF rusak/terpotong: abaikan, kembalikan apa yang sudah terbaca.
  }
  return result;
}

/** Membaca EXIF dari File/Blob. Mengembalikan objek kosong bila bukan JPEG atau gagal dibaca. */
export async function readExifMetadata(file: Blob): Promise<ExifMetadata> {
  try {
    const head = await file.slice(0, EXIF_READ_LIMIT_BYTES).arrayBuffer();
    return parseExifFromBuffer(head);
  } catch {
    return {};
  }
}
