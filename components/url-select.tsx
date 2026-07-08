"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    sp.delete("page");
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  if (options.length === 0) return null;

  const activeLabel = options.find((o) => o.value === value)?.label ?? placeholder;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1.5 text-sm text-ink outline-none transition-colors hover:bg-fill">
        {activeLabel}
        <ChevronDown size={14} className="text-secondary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
        <DropdownMenuItem onSelect={() => onChange("")}>
          {placeholder}
          {value === "" && <Check size={14} className="ml-auto" />}
        </DropdownMenuItem>
        {options.map((o) => (
          <DropdownMenuItem key={o.value} onSelect={() => onChange(o.value)}>
            {o.label}
            {value === o.value && <Check size={14} className="ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
