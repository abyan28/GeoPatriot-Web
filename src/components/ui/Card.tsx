import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "solid" | "bordered";
}

/**
 * Komponen Card bergaya dark surface glassmorphism untuk overlay kamera & modal.
 */
export function Card({ variant = "glass", className = "", children, ...props }: CardProps) {
  const variantClasses = {
    glass: "bg-black/65 backdrop-blur-md border border-white/15 text-white shadow-xl",
    solid: "bg-zinc-900 border border-zinc-800 text-white shadow-lg",
    bordered: "bg-transparent border border-white/20 text-white",
  };

  return (
    <div
      className={`rounded-2xl p-4 transition-all duration-150 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
