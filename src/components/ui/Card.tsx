import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "solid" | "bordered";
}

/**
 * Komponen Card bergaya Deep Navy Glassmorphism untuk overlay kamera & panel.
 */
export function Card({ variant = "glass", className = "", children, ...props }: CardProps) {
  const variantClasses = {
    glass: "bg-[#0e2035]/85 backdrop-blur-md border border-[#2f6d8b]/30 text-white shadow-xl",
    solid: "bg-[#0e2035] border border-[#1a3c61] text-white shadow-lg",
    bordered: "bg-transparent border border-[#2f6d8b]/40 text-white",
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
