import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { FavoriteToggle } from "@/components/favorite-toggle";
import { TYPE_META, itemSnippet } from "@/lib/item-types";
import { cn } from "@/lib/utils";
import type { Item } from "@/db/schema";

/** Shared card surface classes (border color / hover applied by the wrapper). */
export const ITEM_CARD_SURFACE =
  "group relative flex flex-col rounded-card border bg-surface p-5 transition-shadow";

/** Inner content, reused by the link card and the selectable card. */
export function ItemCardBody({
  item,
  hideFavorite = false,
}: {
  item: Item;
  hideFavorite?: boolean;
}) {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;
  const snippet = itemSnippet(item);

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <Badge tone={meta.tone}>
          <Icon size={12} />
          {meta.label}
        </Badge>
        {!hideFavorite && (
          <FavoriteToggle id={item.id} isFavorite={item.isFavorite} />
        )}
      </div>

      <h3 className="line-clamp-2 text-base font-semibold tracking-[-0.2px] text-ink">
        {item.title}
      </h3>
      {snippet && (
        <p className="mt-1 line-clamp-2 text-sm text-secondary">{snippet}</p>
      )}

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

export function ItemCard({ item }: { item: Item }) {
  return (
    <Link
      href={`/items/${item.id}`}
      className={cn(ITEM_CARD_SURFACE, "border-border hover:shadow-soft")}
    >
      <ItemCardBody item={item} />
    </Link>
  );
}
