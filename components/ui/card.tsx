import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Soft shadow instead of a hairline border. */
  elevated?: boolean;
}

/** Container with 16px radius — hairline border by default, soft shadow when elevated. */
export function Card({ elevated = false, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card bg-surface p-6 text-ink",
        elevated ? "border border-transparent shadow-soft" : "border border-border",
        className,
      )}
      {...rest}
    />
  );
}
