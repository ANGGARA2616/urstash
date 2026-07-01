"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import type { Item } from "@/db/schema";
import {
  ItemCard,
  ItemCardBody,
  ITEM_CARD_SURFACE,
} from "@/components/item-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Col = { id: string; name: string };

const NEW = "__new__";

export function ItemsGrid({
  items,
  collections,
}: {
  items: Item[];
  collections: Col[];
}) {
  const router = useRouter();
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-secondary">
          {selectMode
            ? `${selected.size} selected`
            : `${items.length} item${items.length === 1 ? "" : "s"}`}
        </span>
        {selectMode ? (
          <button
            type="button"
            onClick={reset}
            className="text-sm text-secondary hover:text-ink"
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSelectMode(true)}
            className="text-sm font-medium text-accent-strong hover:underline"
          >
            Select
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) =>
          selectMode ? (
            <SelectableCard
              key={item.id}
              item={item}
              selected={selected.has(item.id)}
              onToggle={() => toggle(item.id)}
            />
          ) : (
            <ItemCard key={item.id} item={item} />
          ),
        )}
      </div>

      {selectMode && selected.size > 0 && (
        <div className="sticky bottom-4 z-40 mx-auto flex w-full max-w-2xl flex-wrap items-center gap-2 rounded-pill border border-border bg-surface/90 px-4 py-3 shadow-soft backdrop-blur">
          <span className="text-sm font-medium text-ink">
            {selected.size} selected
          </span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="rounded-pill border border-border bg-fill px-3 py-1.5 text-sm text-ink outline-none focus:border-ink"
          >
            <option value="">Add to…</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={NEW}>+ New collection</option>
          </select>
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
  selected,
  onToggle,
}: {
  item: Item;
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
      <ItemCardBody item={item} hideFavorite />
    </button>
  );
}
