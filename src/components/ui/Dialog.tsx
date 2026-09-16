import React, { useEffect } from "react";
import { CloseIcon } from "@/components/icons";

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
 */
export function Dialog({ isOpen, onClose, title, description, children, footer }: DialogProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl text-white shadow-2xl p-5 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 id="dialog-title" className="text-lg font-bold text-zinc-100">
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
