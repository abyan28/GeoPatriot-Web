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
  emerald: "bg-emerald-950/85 border-emerald-500/50 text-emerald-300",
  sky: "bg-[#0b2436]/90 border-[#2f6d8b]/60 text-[#7ec7e8]", // Muted Teal
  amber: "bg-[#2b200c]/90 border-[#c5984f]/60 text-[#eac47a]", // Warm Gold
  rose: "bg-rose-950/85 border-rose-500/50 text-rose-300",
  zinc: "bg-[#0e2035]/90 border-[#1a3c61]/70 text-[#94a3b8]", // Deep Navy
};

const DOT_CLASSES: Record<StatusTone, string> = {
  emerald: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
  sky: "bg-[#3e88ab] shadow-[0_0_8px_rgba(47,109,139,0.7)]",
  amber: "bg-[#c5984f] shadow-[0_0_8px_rgba(197,152,79,0.7)]",
  rose: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]",
  zinc: "bg-[#2f6d8b]",
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
  onClick,
  onKeyDown,
  tabIndex,
  role,
  ...props
}: StatusChipProps) {
  // Chip yang diberi onClick harus tetap bisa diaktifkan via keyboard (rules #16.1):
  // default tabIndex={0} + role="button" + Enter/Space trigger onClick, kecuali
  // pemanggil sudah menentukan sendiri.
  const isInteractive = Boolean(onClick);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (isInteractive && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onClick?.(event as unknown as React.MouseEvent<HTMLDivElement>);
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-md transition-colors ${TONE_CLASSES[tone]} ${className}`}
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : onKeyDown}
      tabIndex={tabIndex ?? (isInteractive ? 0 : undefined)}
      role={role ?? (isInteractive ? "button" : undefined)}
      {...props}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${DOT_CLASSES[tone]}`} aria-hidden="true" />
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="font-semibold tracking-wide">{label}</span>
      {subLabel && <span className="opacity-80 font-mono text-[11px]">{subLabel}</span>}
    </div>
  );
}

export interface GpsQualityChipProps extends React.HTMLAttributes<HTMLDivElement> {
  quality?: GpsQuality;
  accuracy?: number;
  isManual?: boolean;
}

/**
 * Pemetaan kualitas GPS ke label teks Bahasa Indonesia dan warna status.
 */
export function GpsQualityChip({
  quality,
  accuracy,
  isManual = false,
  className = "",
  ...props
}: GpsQualityChipProps) {
  if (isManual) {
    return (
      <StatusChip
        label="Lokasi Manual"
        subLabel="Tetap"
        icon={<MapPinIcon size={14} />}
        tone="sky"
        className={className}
        {...props}
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
        {...props}
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
          {...props}
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
          {...props}
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
          {...props}
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
          {...props}
        />
      );
  }
}

export interface TimeModeChipProps extends React.HTMLAttributes<HTMLDivElement> {
  isManual?: boolean;
  timeString?: string;
}

/**
 * Indikator mode waktu (Otomatis / Manual).
 */
export function TimeModeChip({
  isManual = false,
  timeString,
  className = "",
  ...props
}: TimeModeChipProps) {
  return (
    <StatusChip
      label={isManual ? "Waktu Manual" : "Waktu Auto"}
      subLabel={timeString}
      icon={<ClockIcon size={14} />}
      tone={isManual ? "amber" : "zinc"}
      className={className}
      {...props}
    />
  );
}
