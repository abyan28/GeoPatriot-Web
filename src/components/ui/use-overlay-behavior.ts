"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Hook perilaku overlay bersama untuk Dialog & BottomSheet (Rules #16.3).
 * Menangani: Escape untuk menutup, body scroll lock, focus trap (Tab/Shift+Tab
 * tidak bisa lolos ke elemen di belakang overlay), auto-focus elemen pertama
 * saat terbuka, dan mengembalikan fokus ke elemen trigger saat overlay ditutup.
 *
 * Dipusatkan di satu tempat agar Dialog dan BottomSheet tidak menduplikasi
 * business rule accessibility yang sama (rules #20.8).
 */
export function useOverlayBehavior(
  isOpen: boolean,
  onClose: () => void,
  containerRef: React.RefObject<HTMLElement | null>,
): void {
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  // Ref selalu menyimpan onClose terbaru, agar handler Escape tidak pernah
  // stale meski identitas fungsi onClose berubah setiap render (mis. inline
  // arrow function dari parent). Ditulis lewat effect terpisah (bukan
  // langsung di badan render) karena menulis ref saat render dilarang
  // React/eslint — effect ini sengaja TIDAK dipakai untuk setup fokus/scroll-lock
  // (itu ada di effect utama di bawah, yang sengaja tidak bergantung ke onClose).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const container = containerRef.current;
    const focusables = container
      ? Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      : [];
    // Fokus awal ke elemen interaktif pertama di dalam overlay, atau ke container itu sendiri.
    (focusables[0] ?? container)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !container) return;

      const currentFocusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null);
      if (currentFocusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = currentFocusables[0];
      const last = currentFocusables[currentFocusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousActiveElementRef.current?.focus?.();
    };
    // SENGAJA tidak menyertakan `onClose` di deps (dibaca lewat onCloseRef) —
    // supaya effect ini (termasuk focus-grab awal) tidak re-run hanya karena
    // parent re-render dan membuat inline onClose baru (audit: menyebabkan
    // fokus input direbut ulang tiap detik, membuat keyboard HP langsung tertutup).
  }, [isOpen, containerRef]);
}
