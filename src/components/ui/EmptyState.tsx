import React from "react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Komponen EmptyState ramah pengguna untuk galeri kosong atau izin tertunda.
 */
export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 ${className}`}
    >
      {icon && (
        <div className="w-16 h-16 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-zinc-200">{title}</h3>
      <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
