"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { ITEM_TYPES, type ItemType } from "@/lib/constants";
import { TYPE_META } from "@/lib/item-types";
import { SearchInput } from "@/components/ui/search-input";
import { cn } from "@/lib/utils";

type Option = {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  section: "results" | "actions";
};

const QUICK_ACTIONS: Option[] = ITEM_TYPES.map((t) => {
  const Icon = TYPE_META[t].icon;
  return {
    key: `new-${t}`,
    label: `New ${TYPE_META[t].label.toLowerCase()}`,
    icon: <Icon size={16} />,
    href: `/items/new?type=${t}`,
    section: "actions" as const,
  };
});

/** Global Ctrl/Cmd+K palette: search all items + quick create actions. */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<
    { id: string; type: ItemType; title: string }[]
  >([]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = React.useRef<HTMLUListElement>(null);

  // Open/close on Ctrl/Cmd+K from anywhere in the app.
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Lock body scroll while open; reset state on close.
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Debounced search, cancelling stale requests.
  React.useEffect(() => {
    if (!open) return;
    if (!query.trim()) {
      setResults([]);
      setActiveIndex(0);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/items?q=${encodeURIComponent(query.trim())}&limit=8`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data: {
          items: { id: string; type: ItemType; title: string }[];
        } = await res.json();
        setResults(
          data.items.map(({ id, type, title }) => ({ id, type, title })),
        );
        setActiveIndex(0);
      } catch {
        // aborted or network error — keep previous results
      }
    }, 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [open, query]);

  const options: Option[] = [
    ...results.map((r) => {
      const Icon = TYPE_META[r.type].icon;
      return {
        key: r.id,
        label: r.title,
        icon: <Icon size={16} />,
        href: `/items/${r.id}`,
        section: "results" as const,
      };
    }),
    ...QUICK_ACTIONS,
  ];

  function select(option: Option) {
    setOpen(false);
    router.push(option.href);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const delta = e.key === "ArrowDown" ? 1 : -1;
      const next = (activeIndex + delta + options.length) % options.length;
      setActiveIndex(next);
      listRef.current
        ?.querySelector(`[data-index="${next}"]`)
        ?.scrollIntoView({ block: "nearest" });
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const option = options[activeIndex];
      if (option) select(option);
    }
  }

  if (!open) return null;

  const firstActionIndex = options.findIndex((o) => o.section === "actions");

  return (
    <div
      className="fixed inset-0 z-[100] bg-ink/20 px-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="mx-auto mt-[15vh] w-full max-w-lg overflow-hidden rounded-panel-lg border border-border bg-surface shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border p-2">
          <SearchInput
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search your stash…"
            aria-label="Search your stash"
            containerClassName="border-0 bg-transparent focus-within:bg-transparent"
          />
        </div>
        <ul
          ref={listRef}
          role="listbox"
          aria-label="Results and actions"
          className="max-h-[50vh] overflow-y-auto p-1.5"
        >
          {query.trim() !== "" && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted">No results</li>
          )}
          {options.map((option, i) => (
            <React.Fragment key={option.key}>
              {i === firstActionIndex && (
                <li
                  aria-hidden
                  className="mx-3 mb-1 mt-2 border-t border-border pt-1 text-xs font-medium uppercase tracking-wide text-muted first:mt-0 first:border-t-0"
                >
                  Quick actions
                </li>
              )}
              <li
                role="option"
                aria-selected={i === activeIndex}
                data-index={i}
                onClick={() => select(option)}
                onMouseMove={() => setActiveIndex(i)}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-panel px-3 py-2 text-sm",
                  i === activeIndex
                    ? "bg-fill text-ink"
                    : "text-secondary hover:text-ink",
                )}
              >
                <span className="shrink-0 text-muted">
                  {option.section === "actions" ? (
                    <span className="flex items-center gap-0.5">
                      <Plus size={12} />
                      {option.icon}
                    </span>
                  ) : (
                    option.icon
                  )}
                </span>
                <span className="truncate">{option.label}</span>
              </li>
            </React.Fragment>
          ))}
        </ul>
      </div>
    </div>
  );
}
