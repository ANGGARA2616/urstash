"use client";

import { Star } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function FavoriteFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get("favorite") === "true";

  function toggle() {
    const sp = new URLSearchParams(params.toString());
    if (active) sp.delete("favorite");
    else sp.set("favorite", "true");
    sp.delete("page");
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-warning bg-warning-tint text-warning"
          : "border-border bg-surface text-secondary hover:bg-fill",
      )}
    >
      <Star size={14} fill={active ? "currentColor" : "none"} />
      Favorites
    </button>
  );
}
