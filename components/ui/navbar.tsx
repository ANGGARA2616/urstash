import * as React from "react";
import { cn } from "@/lib/utils";

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  /** Brand mark or wordmark shown on the left. */
  brand?: React.ReactNode;
  /** Stick the bar to the top of the viewport. */
  sticky?: boolean;
}

/** Glassmorphism navigation bar (backdrop blur, pill-rounded). */
export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  function Navbar({ brand, sticky = false, className, children, ...rest }, ref) {
    return (
      <nav
        ref={ref}
        className={cn("navbar", sticky && "navbar-sticky", className)}
        {...rest}
      >
        <div className="text-lg font-bold tracking-[-0.3px] text-ink">
          {brand}
        </div>
        <div className="flex items-center gap-5">{children}</div>
      </nav>
    );
  },
);
