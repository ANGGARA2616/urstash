"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ELLIPSIS = "…" as const;

/** first, …, current±1, …, last — or all pages when 7 or fewer. */
function pageNumbers(total: number, current: number): (number | typeof ELLIPSIS)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | typeof ELLIPSIS)[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push(ELLIPSIS);
    out.push(p);
    prev = p;
  }
  return out;
}

export function Pagination({
  totalPages,
  currentPage,
}: {
  totalPages: number;
  currentPage: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  if (totalPages <= 1) return null;

  function goTo(page: number) {
    const sp = new URLSearchParams(params.toString());
    if (page > 1) sp.set("page", String(page));
    else sp.delete("page");
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
    window.scrollTo({ top: 0 });
  }

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5">
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => goTo(currentPage - 1)}
      >
        ‹ Prev
      </Button>
      {pageNumbers(totalPages, currentPage).map((p, i) =>
        p === ELLIPSIS ? (
          <span key={`e${i}`} className="px-1 text-sm text-muted">
            {ELLIPSIS}
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => goTo(p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={cn(
              "min-w-9 rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors",
              p === currentPage
                ? "border-ink bg-ink text-white"
                : "border-border bg-surface text-secondary hover:bg-fill",
            )}
          >
            {p}
          </button>
        ),
      )}
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => goTo(currentPage + 1)}
      >
        Next ›
      </Button>
    </nav>
  );
}
