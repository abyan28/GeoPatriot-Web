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
 * Komponen tombol modular GeoPatriot Web.
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
      "inline-flex items-center justify-center font-medium transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

    // Ukuran tombol (tinggi minimal 44px untuk touch target ramah ibu jari)
    const sizeClasses: Record<ButtonSize, string> = {
      sm: "min-h-[40px] px-3 py-1.5 text-xs rounded-lg gap-1.5",
      md: "min-h-[48px] px-4 py-2 text-sm rounded-xl gap-2",
      lg: "min-h-[56px] px-6 py-3 text-base rounded-2xl gap-2.5",
    };

    // Varian visual tombol
    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        "bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-md shadow-amber-500/20",
      secondary: "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700/60",
      glass: "bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/15",
      ghost: "bg-transparent hover:bg-white/10 text-zinc-300 hover:text-white",
      danger: "bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20",
      shutter:
        "w-20 h-20 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 backdrop-blur-sm p-1.5 shadow-xl active:scale-90 transition-transform flex items-center justify-center",
      icon: "w-12 h-12 min-w-[48px] min-h-[48px] p-0 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border border-white/10",
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
              <span className="w-6 h-6 border-3 border-zinc-400 border-t-zinc-800 rounded-full animate-spin" />
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
