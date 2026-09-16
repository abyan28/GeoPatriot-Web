import React from "react";

export type ButtonVariant =
  "primary" | "secondary" | "glass" | "ghost" | "danger" | "shutter" | "icon";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Komponen tombol modular GeoPatriot Web dengan palet warna Deep Navy & Golden Ochre.
 * Memenuhi standar aksesibilitas touch target minimal 44x44px dan keyboard focus.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    // Penentuan kelas dasar touch & feedback
    const baseClasses =
      "inline-flex items-center justify-center font-medium transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c5984f] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

    // Ukuran tombol (tinggi minimal 44px untuk touch target ramah ibu jari)
    const sizeClasses: Record<ButtonSize, string> = {
      sm: "min-h-[40px] px-3 py-1.5 text-xs rounded-lg gap-1.5",
      md: "min-h-[48px] px-4 py-2 text-sm rounded-xl gap-2",
      lg: "min-h-[56px] px-6 py-3 text-base rounded-2xl gap-2.5",
    };

    // Varian visual tombol berakar dari palet Deep Navy & Golden Ochre
    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        "bg-[#c5984f] hover:bg-[#dcab55] text-[#08111d] font-bold shadow-lg shadow-[#c5984f]/25",
      secondary: "bg-[#0e2035] hover:bg-[#152e4d] text-white border border-[#2f6d8b]/40",
      glass:
        "bg-[#08111d]/75 hover:bg-[#0e2035]/90 text-white backdrop-blur-md border border-[#2f6d8b]/30",
      ghost: "bg-transparent hover:bg-white/10 text-zinc-300 hover:text-white",
      danger: "bg-red-700 hover:bg-red-600 text-white shadow-md shadow-red-700/20",
      shutter:
        "w-20 h-20 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 backdrop-blur-sm p-1.5 shadow-2xl active:scale-90 transition-transform flex items-center justify-center",
      icon: "w-12 h-12 min-w-[48px] min-h-[48px] p-0 rounded-full bg-[#0e2035]/80 hover:bg-[#152e4d] text-zinc-200 backdrop-blur-md border border-[#2f6d8b]/30",
    };

    // Tombol shutter khusus kamera
    if (variant === "shutter") {
      return (
        <button
          ref={ref}
          type="button"
          disabled={disabled || isLoading}
          className={`${variantClasses.shutter} ${className}`}
          {...props}
        >
          <span className="w-full h-full rounded-full bg-white transition-colors group-hover:bg-zinc-100 flex items-center justify-center">
            {isLoading ? (
              <span className="w-6 h-6 border-3 border-[#c5984f] border-t-[#08111d] rounded-full animate-spin" />
            ) : (
              children
            )}
          </span>
        </button>
      );
    }

    const currentSize = variant === "icon" ? "" : sizeClasses[size];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${currentSize} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  },
);

Button.displayName = "Button";
