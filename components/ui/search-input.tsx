import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  containerClassName?: string;
}

/** Search field: leading icon + borderless input inside a pill container. */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({ icon, className, containerClassName, ...rest }, ref) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-pill border border-border bg-fill px-4 py-2.5 transition-colors focus-within:border-ink focus-within:bg-surface",
          containerClassName,
        )}
      >
        <span className="flex shrink-0 text-muted">
          {icon ?? <Search size={18} />}
        </span>
        <input
          ref={ref}
          className={cn(
            "flex-1 border-0 bg-transparent text-base text-ink outline-none placeholder:text-muted",
            className,
          )}
          {...rest}
        />
      </div>
    );
  },
);
