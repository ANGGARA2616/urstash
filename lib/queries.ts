import { and, arrayContains, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  accessTokens,
  collections,
  items,
  ITEM_TYPES,
  type ItemType,
} from "@/db/schema";

export type ItemFilters = {
  q?: string | null;
  type?: string | null;
  tag?: string | null;
  collection?: string | null;
  favorite?: boolean;
};

/** Shared list+search+filter used by both /api/items and the dashboard server page. */
export async function listItems(userId: string, f: ItemFilters = {}) {
  const conditions = [eq(items.userId, userId)];

  if (f.type && (ITEM_TYPES as readonly string[]).includes(f.type)) {
    conditions.push(eq(items.type, f.type as ItemType));
  }
  if (f.collection) conditions.push(eq(items.collectionId, f.collection));
  if (f.favorite) conditions.push(eq(items.isFavorite, true));
  if (f.tag) conditions.push(arrayContains(items.tags, [f.tag]));
  if (f.q) {
    const like = `%${f.q}%`;
    const match = or(
      ilike(items.title, like),
      sql`${items.content}::text ilike ${like}`,
    );
    if (match) conditions.push(match);
  }

  return db
    .select()
    .from(items)
    .where(and(...conditions))
    .orderBy(desc(items.isFavorite), desc(items.createdAt));
}

export async function getItem(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(items)
    .where(and(eq(items.id, id), eq(items.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function listCollections(userId: string) {
  return db
    .select()
    .from(collections)
    .where(eq(collections.userId, userId))
    .orderBy(asc(collections.name));
}

export async function listTokens(userId: string) {
  return db
    .select({
      id: accessTokens.id,
      label: accessTokens.label,
      createdAt: accessTokens.createdAt,
      lastUsedAt: accessTokens.lastUsedAt,
    })
    .from(accessTokens)
    .where(eq(accessTokens.userId, userId))
    .orderBy(desc(accessTokens.createdAt));
}

/** Distinct tags across the user's items, for the tag filter. */
export async function distinctTags(userId: string): Promise<string[]> {
  const rows = await db
    .select({ tags: items.tags })
    .from(items)
    .where(eq(items.userId, userId));
  const set = new Set<string>();
  for (const r of rows) for (const t of r.tags ?? []) set.add(t);
  return [...set].sort((a, b) => a.localeCompare(b));
}
