"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant = "primary", loading, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60";

    const variants = {
      primary: "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 focus-visible:ring-indigo-600",
      ghost: "text-indigo-600 hover:bg-indigo-50",
      outline: "border border-slate-200 text-slate-900 hover:bg-slate-50"
    } as const;

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-transparent" />}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";
