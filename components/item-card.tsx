"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { FavoriteToggle } from "@/components/favorite-toggle";
import { TYPE_META } from "@/lib/item-types";
import { cn } from "@/lib/utils";
import type { Item } from "@/db/schema";

/** Shared card surface classes (border color / hover applied by the wrapper). */
export const ITEM_CARD_SURFACE =
  "group relative flex flex-col rounded-card border bg-surface p-5 transition-shadow";

/** Lazy thumbnail with a fade-in once the image has loaded. */
function CardThumb({ src }: { src: string }) {
  const [loaded, setLoaded] = React.useState(false);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={cn(
        "mb-3 aspect-video w-full rounded-panel border border-border bg-fill object-cover transition-opacity duration-300",
        loaded ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

/** Inner content, reused by the link card and the selectable card. */
export function ItemCardBody({
  item,
  previewUrl,
  hideFavorite = false,
}: {
  item: Item;
  previewUrl?: string;
  hideFavorite?: boolean;
}) {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;

  // Derive item status from existing data — no DB change needed
  const status: "favorited" | "saved" | null = item.isFavorite
    ? "favorited"
    : item.collectionId
      ? "saved"
      : null;

  return (
    <>
      {previewUrl && <CardThumb src={previewUrl} />}

      <div className="mb-1 flex items-center justify-between">
        <Badge tone={meta.tone}>
          <Icon size={12} />
          {meta.label}
        </Badge>
        {!hideFavorite && (
          <FavoriteToggle id={item.id} isFavorite={item.isFavorite} />
        )}
      </div>

      {/* Status badge — reflects current item state */}
      <div className="mb-3 h-5">
        {status === "favorited" && (
          <span className="inline-flex items-center gap-1 rounded-pill bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            ★ Favorited
          </span>
        )}
        {status === "saved" && (
          <span className="inline-flex items-center gap-1 rounded-pill bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent-strong">
            ⊞ In collection
          </span>
        )}
      </div>

      <h3 className="line-clamp-2 text-base font-semibold tracking-[-0.2px] text-ink">
        {item.title}
      </h3>

      {item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-pill bg-fill px-2 py-0.5 text-xs text-secondary"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

export function ItemCard({
  item,
  previewUrl,
}: {
  item: Item;
  previewUrl?: string;
}) {
  return (
    <Link
      href={`/items/${item.id}`}
      className={cn(ITEM_CARD_SURFACE, "border-border hover:shadow-soft")}
    >
      <ItemCardBody item={item} previewUrl={previewUrl} />
    </Link>
  );
}
