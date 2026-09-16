import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Photo, Session } from "@/types/session";

/**
 * Definisi schema IndexedDB dan koneksi database.
 * Lihat agents/workflow-geopatriot-web.md #10 dan agents/rules-geopatriot-web.md #8.
 *
 * File ini adalah satu-satunya tempat yang boleh membuka koneksi IndexedDB.
 * Akses ke database HARUS lewat repository (session-repository.ts,
 * photo-repository.ts, settings-repository.ts), tidak langsung dari sini (rules #8.1, workflow #10).
 */

export const DB_NAME = "geopatriot-web";
export const DB_VERSION = 1;

/** Baris pengaturan generik yang disimpan sebagai key-value di store "settings". */
export interface SettingsRecord {
  key: string;
  value: unknown;
}

export interface GeoPatriotDbSchema extends DBSchema {
  sessions: {
    key: string;
    value: Session;
    indexes: { "by-createdAt": string };
  };
  photos: {
    key: string;
    value: Photo;
    indexes: { "by-sessionId": string };
  };
  settings: {
    key: string;
    value: SettingsRecord;
  };
}

let dbPromise: Promise<IDBPDatabase<GeoPatriotDbSchema>> | null = null;

/**
 * Membuka (atau membuat) koneksi database. Koneksi di-cache sebagai singleton
 * per proses browser agar tidak membuka koneksi berulang kali (storage layer
 * wajib asynchronous, rules #8.3).
 */
export function getDb(): Promise<IDBPDatabase<GeoPatriotDbSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<GeoPatriotDbSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const sessionStore = db.createObjectStore("sessions", { keyPath: "id" });
        sessionStore.createIndex("by-createdAt", "createdAt");

        const photoStore = db.createObjectStore("photos", { keyPath: "id" });
        photoStore.createIndex("by-sessionId", "sessionId");

        db.createObjectStore("settings", { keyPath: "key" });
      },
    });
  }
  return dbPromise;
}

/**
 * Mendeteksi kegagalan yang mengindikasikan storage penuh/quota terlampaui,
 * dipakai repository untuk memutuskan pesan error yang tepat (rules #8.6, PRD #22).
 */
export function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.code === 22)
  );
}
