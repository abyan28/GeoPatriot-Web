import React, { useId, useRef } from "react";
import { CloseIcon } from "@/components/icons";
import { useOverlayBehavior } from "./use-overlay-behavior";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * BottomSheet drawer mobile-first untuk progressive disclosure (Rules #15.4)
 * dengan gaya Deep Navy & Golden Ochre.
 * Focus trap, auto-focus awal, dan focus-return ke trigger ditangani oleh
 * useOverlayBehavior agar konsisten dengan Dialog.
 */
export function BottomSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
}: BottomSheetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  useOverlayBehavior(isOpen, onClose, containerRef);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Kontainer Panel Drawer */}
      <div
        ref={containerRef}
        tabIndex={-1}
        className="w-full max-w-lg mx-auto bg-[#0e2035] border-t border-[#2f6d8b]/50 rounded-t-3xl text-white shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle Bar Sentuh */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Geser untuk menutup panel"
          className="flex justify-center pt-3 pb-1 w-full"
        >
          <span className="w-12 h-1.5 rounded-full bg-[#2f6d8b]/60 hover:bg-[#c5984f] transition-colors" />
        </button>

        {/* Header Drawer */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-[#1a3c61]">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-white tracking-wide">
              {title}
            </h2>
            {description && <p className="text-xs text-[#94a3b8] mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#142d4a] hover:bg-[#1b3d64] text-zinc-300 hover:text-white transition-colors border border-[#2f6d8b]/30"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Konten Scrollable */}
        <div className="px-6 py-4 overflow-y-auto flex-1 overscroll-contain">{children}</div>

        {/* Footer Aksi (Opsional) */}
        {footer && (
          <div className="p-4 border-t border-[#1a3c61] bg-[#08111d] rounded-b-3xl">{footer}</div>
        )}
      </div>
    </div>
  );
}
