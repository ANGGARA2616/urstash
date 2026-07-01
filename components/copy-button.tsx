"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyButton({
  text,
  label = "Copy",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — ignore
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-fill",
        className,
      )}
    >
      {copied ? (
        <Check size={14} className="text-success" />
      ) : (
        <Copy size={14} />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}
