import React from "react";
import type { GpsQuality } from "@/types/location";
import { MapPinIcon, ClockIcon } from "@/components/icons";

export type StatusTone = "emerald" | "sky" | "amber" | "rose" | "zinc";

export interface StatusChipProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  tone?: StatusTone;
  active?: boolean;
}

const TONE_CLASSES: Record<StatusTone, string> = {
  emerald: "bg-emerald-950/80 border-emerald-500/50 text-emerald-300",
  sky: "bg-sky-950/80 border-sky-500/50 text-sky-300",
  amber: "bg-amber-950/80 border-amber-500/50 text-amber-300",
  rose: "bg-rose-950/80 border-rose-500/50 text-rose-300",
  zinc: "bg-zinc-900/80 border-zinc-700/60 text-zinc-300",
};

const DOT_CLASSES: Record<StatusTone, string> = {
  emerald: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
  sky: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]",
  amber: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
  rose: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]",
  zinc: "bg-zinc-500",
};

/**
 * Komponen chip status terpadu dengan teks eksplisit dan indikator visual.
 * Memenuhi Accessibility Rule #16.2: tidak mengandalkan warna semata.
 */
export function StatusChip({
  label,
  subLabel,
  icon,
  tone = "zinc",
  className = "",
  ...props
}: StatusChipProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-md transition-colors ${TONE_CLASSES[tone]} ${className}`}
      {...props}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${DOT_CLASSES[tone]}`} aria-hidden="true" />
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="font-semibold tracking-wide">{label}</span>
      {subLabel && <span className="opacity-80 font-mono text-[11px]">{subLabel}</span>}
    </div>
  );
}

/**
 * Pemetaan kualitas GPS ke label teks Bahasa Indonesia dan warna status.
 */
export function GpsQualityChip({
  quality,
  accuracy,
  isManual = false,
  className = "",
}: {
  quality?: GpsQuality;
  accuracy?: number;
  isManual?: boolean;
  className?: string;
}) {
  if (isManual) {
    return (
      <StatusChip
        label="Lokasi Manual"
        subLabel="Tetap"
        icon={<MapPinIcon size={14} />}
        tone="sky"
        className={className}
      />
    );
  }

  if (!quality) {
    return (
      <StatusChip
        label="Mencari GPS..."
        icon={<MapPinIcon size={14} className="animate-pulse" />}
        tone="zinc"
        className={className}
      />
    );
  }

  const accuracyText = typeof accuracy === "number" ? `±${Math.round(accuracy)}m` : undefined;

  switch (quality) {
    case "excellent":
      return (
        <StatusChip
          label="GPS Sangat Baik"
          subLabel={accuracyText}
          icon={<MapPinIcon size={14} />}
          tone="emerald"
          className={className}
        />
      );
    case "good":
      return (
        <StatusChip
          label="GPS Baik"
          subLabel={accuracyText}
          icon={<MapPinIcon size={14} />}
          tone="sky"
          className={className}
        />
      );
    case "fair":
      return (
        <StatusChip
          label="GPS Cukup"
          subLabel={accuracyText}
          icon={<MapPinIcon size={14} />}
          tone="amber"
          className={className}
        />
      );
    case "poor":
      return (
        <StatusChip
          label="GPS Kurang"
          subLabel={accuracyText}
          icon={<MapPinIcon size={14} />}
          tone="rose"
          className={className}
        />
      );
  }
}

/**
 * Indikator mode waktu (Otomatis / Manual).
 */
export function TimeModeChip({
  isManual = false,
  timeString,
  className = "",
}: {
  isManual?: boolean;
  timeString?: string;
  className?: string;
}) {
  return (
    <StatusChip
      label={isManual ? "Waktu Manual" : "Waktu Auto"}
      subLabel={timeString}
      icon={<ClockIcon size={14} />}
      tone={isManual ? "amber" : "zinc"}
      className={className}
    />
  );
}
