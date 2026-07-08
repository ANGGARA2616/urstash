"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, CheckCircle2, ChevronDown, Circle } from "lucide-react";
import type { Item } from "@/db/schema";
import {
  ItemCard,
  ItemCardBody,
  ITEM_CARD_SURFACE,
} from "@/components/item-card";
import { Pagination } from "@/components/pagination";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Col = { id: string; name: string };

const NEW = "__new__";

export function ItemsGrid({
  items,
  previews,
  collections,
}: {
  items: Item[];
  previews: Record<string, string>;
  collections: Col[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const pageSize = isDesktop ? 15 : 10;
  const rawPage = Number(searchParams.get("page")) || 1;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(1, rawPage), totalPages);
  const visible = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const [selectMode, setSelectMode] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [target, setTarget] = React.useState("");
  const [newName, setNewName] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reset() {
    setSelected(new Set());
    setSelectMode(false);
    setTarget("");
    setNewName("");
    setMsg(null);
  }

  async function assign() {
    if (selected.size === 0) return;
    if (!target) {
      setMsg("Pick a collection.");
      return;
    }
    const body: {
      itemIds: string[];
      collectionId?: string;
      newCollectionName?: string;
    } = { itemIds: [...selected] };

    if (target === NEW) {
      if (!newName.trim()) {
        setMsg("Enter a name.");
        return;
      }
      body.newCollectionName = newName.trim();
    } else {
      body.collectionId = target;
    }

    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/collections/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      setMsg(d?.error ?? "Failed.");
      return;
    }
    reset();
    router.refresh();
  }

  const targetLabel =
    target === NEW
      ? "+ New collection"
      : (collections.find((c) => c.id === target)?.name ?? "Add to…");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-secondary">
          {selectMode
            ? `${selected.size} selected`
            : `${items.length} item${items.length === 1 ? "" : "s"}`}
        </span>
        {selectMode ? (
          <Button variant="secondary" size="sm" onClick={reset}>
            Cancel
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setSelectMode(true)}>
            Select
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) =>
          selectMode ? (
            <SelectableCard
              key={item.id}
              item={item}
              previewUrl={previews[item.id]}
              selected={selected.has(item.id)}
              onToggle={() => toggle(item.id)}
            />
          ) : (
            <ItemCard key={item.id} item={item} previewUrl={previews[item.id]} />
          ),
        )}
      </div>

      <Pagination totalPages={totalPages} currentPage={currentPage} />

      {selectMode && selected.size > 0 && (
        <div className="sticky bottom-4 z-40 mx-auto flex w-full max-w-2xl flex-wrap items-center gap-2 rounded-pill border border-border bg-surface/90 px-4 py-3 shadow-soft backdrop-blur">
          <span className="text-sm font-medium text-ink">
            {selected.size} selected
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1.5 text-sm text-ink outline-none transition-colors hover:bg-fill">
              {targetLabel}
              <ChevronDown size={14} className="text-secondary" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
              {collections.map((c) => (
                <DropdownMenuItem key={c.id} onSelect={() => setTarget(c.id)}>
                  {c.name}
                  {target === c.id && <Check size={14} className="ml-auto" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onSelect={() => setTarget(NEW)}>
                + New collection
                {target === NEW && <Check size={14} className="ml-auto" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {target === NEW && (
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Collection name"
              className="min-w-[140px] flex-1 rounded-pill border border-border bg-fill px-3 py-1.5 text-sm text-ink outline-none focus:border-ink"
            />
          )}
          <Button size="sm" onClick={assign} disabled={saving}>
            {saving ? "Adding…" : "Add"}
          </Button>
          {msg && <span className="text-sm text-danger">{msg}</span>}
        </div>
      )}
    </div>
  );
}

function SelectableCard({
  item,
  previewUrl,
  selected,
  onToggle,
}: {
  item: Item;
  previewUrl?: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        ITEM_CARD_SURFACE,
        "cursor-pointer text-left",
        selected
          ? "border-ink ring-2 ring-ink"
          : "border-border hover:shadow-soft",
      )}
    >
      <span className="absolute right-3 top-3 z-10">
        {selected ? (
          <CheckCircle2 size={20} className="text-ink" />
        ) : (
          <Circle size={20} className="text-muted" />
        )}
      </span>
      <ItemCardBody item={item} previewUrl={previewUrl} hideFavorite />
    </button>
  );
}
