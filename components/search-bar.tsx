"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = React.useState(params.get("q") ?? "");

  // Debounced write of the query into the URL.
  React.useEffect(() => {
    const current = params.get("q") ?? "";
    if (value === current) return;
    const t = setTimeout(() => {
      const sp = new URLSearchParams(params.toString());
      if (value) sp.set("q", value);
      else sp.delete("q");
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, 300);
    return () => clearTimeout(t);
  }, [value, params, pathname, router]);

  return (
    <SearchInput
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Search everything…"
      aria-label="Search items"
    />
  );
}
