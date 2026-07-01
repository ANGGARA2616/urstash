import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "success" | "warning" | "danger" | "accent" | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

const toneClass: Record<BadgeTone, string> = {
  success: "bg-success-tint text-success",
  warning: "bg-warning-tint text-warning",
  danger: "bg-danger-tint text-danger",
  accent: "bg-accent-tint text-accent-strong",
  neutral: "bg-fill text-secondary",
};

/** Small pill label for status / type / tags. */
export function Badge({
  tone = "accent",
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold leading-4 tracking-[0.2px]",
        toneClass[tone],
        className,
      )}
      {...rest}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
