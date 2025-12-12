import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "danger" | "neutral";
}

export function Badge({ className, children, variant = "neutral", ...props }: BadgeProps) {
  const variants = {
    success: "border border-emerald-200/80 bg-emerald-50/80 text-emerald-700 shadow-sm",
    danger: "border border-rose-200 bg-rose-50 text-rose-600 shadow-sm",
    neutral: "border border-slate-200/80 bg-slate-100/70 text-slate-700"
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
