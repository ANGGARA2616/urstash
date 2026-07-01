import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "accent";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** `primary` = ink pill with shine sweep, `secondary` = outline glass, `accent` = blue. */
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  accent: "btn-accent",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
};

/** Pill-shaped button. The primary variant carries the brand shine sweep on hover. */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", className, children, type = "button", ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn("btn", variantClass[variant], sizeClass[size], className)}
        {...rest}
      >
        <span className="btn-label">{children}</span>
      </button>
    );
  },
);
