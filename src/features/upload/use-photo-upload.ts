"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Photo } from "@/types/session";
import type { WatermarkVisualSettings } from "@/types/watermark";
import { buildMetadataSnapshot } from "@/features/metadata/use-metadata-config";
import { parseCoordinatePair, formatCoordinatePair } from "@/features/metadata/parse-coordinate-pair";
import { readExifMetadata } from "@/lib/image/exif-reader";
import { processUploadedPhoto } from "@/lib/image/upload-watermark";
import { resolveCoordinateDetails } from "@/lib/providers/resolve-coordinate";
import { addPhoto } from "@/lib/storage/photo-repository";

const MAP_PROVIDER_ATTRIBUTION = "© LocationIQ";
const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type UploadItemStatus = "pending" | "processing" | "done" | "error";

export interface UploadItem {
  id: string;
  file: File;
  previewUrl: string;
  /** Nilai override per foto; string kosong = ikuti nilai bersama. */
  coordText: string;
  dateTime: string;
  /** Nilai yang terbaca dari EXIF (untuk info/pre-fill), bila ada. */
  exifCoordText?: string;
  exifDateTime?: string;
  status: UploadItemStatus;
  errorMessage?: string;
}

export interface UsePhotoUploadParams {
  watermarkSettings: WatermarkVisualSettings;
  ensureActiveSession: () => Promise<string>;
  onPhotoSaved?: (photo: Photo) => void;
}

export interface UsePhotoUploadReturn {
  items: UploadItem[];
  sharedCoordText: string;
  sharedDateTime: string;
  sharedNote: string;
  isProcessing: boolean;
  setSharedCoordText: (v: string) => void;
  setSharedDateTime: (v: string) => void;
  setSharedNote: (v: string) => void;
  addFiles: (files: FileList | File[]) => Promise<{ rejected: number }>;
  updateItem: (id: string, patch: Partial<Pick<UploadItem, "coordText" | "dateTime">>) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  /** Memproses semua foto pending/error satu per satu. Mengembalikan jumlah berhasil & gagal. */
  processAll: () => Promise<{ succeeded: number; failed: number }>;
}

/** Nilai awal waktu bersama: sekarang, format datetime-local. */
function nowLocalInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Hook pengelola upload foto + watermark offline-first: user memotret dulu tanpa sinyal,
 * lalu menambahkan koordinat & waktu secara manual saat online. Memakai ulang
 * buildMetadataSnapshot, renderWatermark, dan addPhoto yang sama dengan capture kamera.
 */
export function usePhotoUpload({
  watermarkSettings,
  ensureActiveSession,
  onPhotoSaved,
}: UsePhotoUploadParams): UsePhotoUploadReturn {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [sharedCoordText, setSharedCoordText] = useState("");
  const [sharedDateTime, setSharedDateTime] = useState<string>(nowLocalInput);
  const [sharedNote, setSharedNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Ref agar processAll selalu membaca nilai terbaru tanpa menjadi dependency yang berubah-ubah.
  const itemsRef = useRef<UploadItem[]>(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  const isProcessingRef = useRef(false);
  const logoRef = useRef<HTMLImageElement | null>(null);
  // Hindari prefill ulang bila user sudah mengisi/menyunting nilai bersama sendiri.
  const sharedTouchedRef = useRef({ coord: false, time: false });

  useEffect(() => {
    const img = new window.Image();
    img.src = "/app-icon.png";
    img.onload = () => {
      logoRef.current = img;
    };
  }, []);

  // Revoke semua preview URL saat unmount.
  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) URL.revokeObjectURL(item.previewUrl);
    };
  }, []);

  const patchItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const all = Array.from(files);
    const accepted = all.filter((f) => SUPPORTED_TYPES.includes(f.type));
    const rejected = all.length - accepted.length;

    const created: UploadItem[] = accepted.map((file) => ({
      id: `up_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      coordText: "",
      dateTime: "",
      status: "pending",
    }));
    if (created.length === 0) return { rejected };
    setItems((prev) => [...prev, ...created]);

    // EXIF dibaca setelah item tampil, agar UI tidak menunggu.
    for (const item of created) {
      const exif = await readExifMetadata(item.file);
      const exifCoordText =
        exif.latitude !== undefined && exif.longitude !== undefined
          ? formatCoordinatePair(exif.latitude, exif.longitude)
          : undefined;
      patchItem(item.id, { exifCoordText, exifDateTime: exif.capturedAtLocal });

      if (exifCoordText && !sharedTouchedRef.current.coord) {
        sharedTouchedRef.current.coord = true;
        setSharedCoordText(exifCoordText);
      }
      if (exif.capturedAtLocal && !sharedTouchedRef.current.time) {
        sharedTouchedRef.current.time = true;
        setSharedDateTime(exif.capturedAtLocal);
      }
    }
    return { rejected };
  }, [patchItem]);

  const updateItem = useCallback(
    (id: string, patch: Partial<Pick<UploadItem, "coordText" | "dateTime">>) => {
      patchItem(id, patch);
    },
    [patchItem],
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((it) => it.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems((prev) => {
      for (const it of prev) URL.revokeObjectURL(it.previewUrl);
      return [];
    });
    sharedTouchedRef.current = { coord: false, time: false };
  }, []);

  const wrappedSetCoord = useCallback((v: string) => {
    sharedTouchedRef.current.coord = true;
    setSharedCoordText(v);
  }, []);
  const wrappedSetTime = useCallback((v: string) => {
    sharedTouchedRef.current.time = true;
    setSharedDateTime(v);
  }, []);

  const processAll = useCallback(async () => {
    if (isProcessingRef.current) return { succeeded: 0, failed: 0 };
    isProcessingRef.current = true;
    setIsProcessing(true);

    let succeeded = 0;
    let failed = 0;
    // Cache hasil geocode+map per koordinat agar foto di titik yang sama tidak memanggil API berulang.
    const detailCache = new Map<string, Awaited<ReturnType<typeof resolveCoordinateDetails>>>();

    try {
      const sessionId = await ensureActiveSession();
      const queue = itemsRef.current.filter((it) => it.status === "pending" || it.status === "error");

      for (const item of queue) {
        patchItem(item.id, { status: "processing", errorMessage: undefined });

        const coord = parseCoordinatePair(item.coordText.trim() || sharedCoordText);
        if (!coord) {
          patchItem(item.id, {
            status: "error",
            errorMessage: "Koordinat belum diisi atau formatnya salah.",
          });
          failed++;
          continue;
        }
        const dateTime = item.dateTime || sharedDateTime;
        if (!dateTime || Number.isNaN(new Date(dateTime).getTime())) {
          patchItem(item.id, { status: "error", errorMessage: "Tanggal & waktu belum valid." });
          failed++;
          continue;
        }

        const cacheKey = `${coord.latitude.toFixed(5)},${coord.longitude.toFixed(5)}`;
        let details = detailCache.get(cacheKey);
        if (!details) {
          details = await resolveCoordinateDetails(coord.latitude, coord.longitude, {
            mapZoom: watermarkSettings.mapZoom,
            includeMap: watermarkSettings.visibleFields.mapThumbnail,
          });
          detailCache.set(cacheKey, details);
        }

        const snapshot = buildMetadataSnapshot({
          locationMode: "manual",
          timeMode: "manual",
          manualLocation: {
            latitude: coord.latitude,
            longitude: coord.longitude,
            locationName: "",
            address: "",
          },
          manualDateTime: dateTime,
          customNote: sharedNote,
          resolvedAddressInfo: details,
        });

        const result = await processUploadedPhoto({
          file: item.file,
          snapshot,
          settings: watermarkSettings,
          logoImage: logoRef.current ?? undefined,
          mapThumbnailImage: details.mapThumbnailImage,
          mapThumbnailUrl: details.mapThumbnailUrl,
          providerAttribution: MAP_PROVIDER_ATTRIBUTION,
        });

        if (result.status !== "success" || !result.originalBlob || !result.processedBlob) {
          patchItem(item.id, {
            status: "error",
            errorMessage: result.errorMessage ?? "Gagal memproses foto.",
          });
          failed++;
          continue;
        }

        const photo: Photo = {
          id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          sessionId,
          originalBlob: result.originalBlob,
          processedBlob: result.processedBlob,
          thumbnailBlob: result.thumbnailBlob ?? result.processedBlob,
          snapshot,
          processingStatus: "done",
          downloaded: false,
        };
        const saved = await addPhoto(photo);
        if (saved.status !== "success") {
          patchItem(item.id, {
            status: "error",
            errorMessage: saved.message || "Gagal menyimpan foto ke penyimpanan lokal.",
          });
          failed++;
          continue;
        }

        patchItem(item.id, { status: "done" });
        onPhotoSaved?.(photo);
        succeeded++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan saat memproses.";
      setItems((prev) =>
        prev.map((it) =>
          it.status === "processing" ? { ...it, status: "error", errorMessage: message } : it,
        ),
      );
    } finally {
      for (const details of detailCache.values()) {
        if (details.mapThumbnailUrl) URL.revokeObjectURL(details.mapThumbnailUrl);
      }
      isProcessingRef.current = false;
      setIsProcessing(false);
    }

    return { succeeded, failed };
  }, [
    ensureActiveSession,
    patchItem,
    sharedCoordText,
    sharedDateTime,
    sharedNote,
    watermarkSettings,
    onPhotoSaved,
  ]);

  return {
    items,
    sharedCoordText,
    sharedDateTime,
    sharedNote,
    isProcessing,
    setSharedCoordText: wrappedSetCoord,
    setSharedDateTime: wrappedSetTime,
    setSharedNote,
    addFiles,
    updateItem,
    removeItem,
    clearAll,
    processAll,
  };
}
