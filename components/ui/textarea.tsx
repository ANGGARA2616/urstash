import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

/** Multiline input with 16px radius (softer than the pill inputs). */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid = false, className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-card border bg-fill px-4 py-3 text-base leading-6 text-ink outline-none transition-colors placeholder:text-muted focus:border-ink focus:bg-surface",
          invalid ? "border-danger" : "border-border",
          className,
        )}
        {...rest}
      />
    );
  },
);
