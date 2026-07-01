import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

/** Pill-shaped text input. */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ invalid = false, className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-pill border bg-fill px-4 py-2.5 text-base leading-[22px] text-ink outline-none transition-colors placeholder:text-muted focus:border-ink focus:bg-surface",
          invalid ? "border-danger" : "border-border",
          className,
        )}
        {...rest}
      />
    );
  },
);
