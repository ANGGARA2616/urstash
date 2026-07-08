"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ITEM_TYPES } from "@/lib/constants";
import { TYPE_META } from "@/lib/item-types";

const OPTIONS = [
  { value: "", label: "All" },
  ...ITEM_TYPES.map((t) => ({ value: t, label: TYPE_META[t].label })),
];

export function TypeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get("type") ?? "";

  function select(value: string) {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set("type", value);
    else sp.delete("type");
    sp.delete("page");
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => select(o.value)}
          className={cn(
            "rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors",
            active === o.value
              ? "border-ink bg-ink text-white"
              : "border-border bg-surface text-secondary hover:bg-fill",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
