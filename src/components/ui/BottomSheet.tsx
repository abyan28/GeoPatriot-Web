import React, { useEffect } from "react";
import { CloseIcon } from "@/components/icons";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * BottomSheet drawer mobile-first untuk progressive disclosure (Rules #15.4).
 * Menghindari penumpukan panel berlebih di atas viewport kamera.
 */
export function BottomSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
}: BottomSheetProps) {
  // Menutup bottom sheet saat tombol Escape ditekan
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bottom-sheet-title"
    >
      {/* Kontainer Panel Drawer */}
      <div
        className="w-full max-w-lg mx-auto bg-zinc-900 border-t border-zinc-700/80 rounded-t-3xl text-white shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle Bar Sentuh */}
        <div className="flex justify-center pt-3 pb-1 cursor-pointer" onClick={onClose}>
          <span className="w-12 h-1.5 rounded-full bg-zinc-600 hover:bg-zinc-500 transition-colors" />
        </div>

        {/* Header Drawer */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800">
          <div>
            <h2 id="bottom-sheet-title" className="text-lg font-bold text-zinc-100">
              {title}
            </h2>
            {description && <p className="text-xs text-zinc-400 mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Konten Scrollable */}
        <div className="px-6 py-4 overflow-y-auto flex-1 overscroll-contain">{children}</div>

        {/* Footer Aksi (Opsional) */}
        {footer && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 rounded-b-3xl">{footer}</div>
        )}
      </div>
    </div>
  );
}
