"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function UrlSelect({
  param,
  options,
  placeholder,
}: {
  param: string;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const value = params.get(param) ?? "";

  function onChange(v: string) {
    const sp = new URLSearchParams(params.toString());
    if (v) sp.set(param, v);
    else sp.delete(param);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  if (options.length === 0) return null;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-pill border border-border bg-surface px-3 py-1.5 text-sm text-ink outline-none transition-colors focus:border-ink"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
