import React, { useId, useRef } from "react";
import { CloseIcon } from "@/components/icons";
import { useOverlayBehavior } from "./use-overlay-behavior";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Modal Dialog accessible untuk konfirmasi aksi penting atau peringatan (Rules #16.3).
 * Focus trap, auto-focus awal, dan focus-return ke trigger ditangani oleh
 * useOverlayBehavior agar konsisten dengan BottomSheet.
 */
export function Dialog({ isOpen, onClose, title, description, children, footer }: DialogProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  useOverlayBehavior(isOpen, onClose, containerRef);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl text-white shadow-2xl p-5 flex flex-col gap-4 animate-in zoom-in-95 duration-150 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 id={titleId} className="text-lg font-bold text-zinc-100">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {children && <div className="text-sm text-zinc-300">{children}</div>}

        {footer && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
