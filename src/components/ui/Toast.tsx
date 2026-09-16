"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckIcon, AlertTriangleIcon, InfoIcon, CloseIcon } from "@/components/icons";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Hook untuk memicu notifikasi Toast dari komponen mana pun.
 */
export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast harus digunakan di dalam ToastProvider");
  }
  return context;
}

/**
 * Provider global untuk menampilkan pesan Toast non-intrusif di atas layar.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message }]);

      // Auto-dismiss setelah 3.5 detik
      setTimeout(() => {
        removeToast(id);
      }, 3500);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed top-4 inset-x-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md border text-sm max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-200 ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
                : toast.type === "error"
                  ? "bg-rose-950/90 border-rose-500/50 text-rose-200"
                  : "bg-zinc-900/90 border-zinc-700 text-zinc-200"
            }`}
          >
            <span className="shrink-0">
              {toast.type === "success" && <CheckIcon size={18} className="text-emerald-400" />}
              {toast.type === "error" && <AlertTriangleIcon size={18} className="text-rose-400" />}
              {toast.type === "info" && <InfoIcon size={18} className="text-sky-400" />}
            </span>
            <p className="flex-1 font-medium leading-tight">{toast.message}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Tutup notifikasi"
              className="shrink-0 p-1 opacity-60 hover:opacity-100 transition-opacity"
            >
              <CloseIcon size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
