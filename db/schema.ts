import {
  pgTable,
  uuid,
  text,
  jsonb,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { ITEM_TYPES, type ItemType } from "@/lib/constants";

// Re-export so `@/db/schema` stays the single import site for server code.
// The `type` column enum is TS-only (no DB constraint) — fine for v1.
export { ITEM_TYPES, type ItemType };

/* ---- type-specific `content` jsonb shapes (see PRD §5) ---- */
export type LinkContent = {
  url: string;
  favicon?: string;
  screenshotUrl?: string;
  description?: string;
};
export type PromptContent = {
  promptText: string;
  targetAi?: string;
  variables?: string[];
};
export type ScreenshotContent = {
  imageUrl: string;
  sourceUrl?: string;
  styleTags?: string[];
};
/** `format: "html"` marks rich-text bodies; absent means legacy plain text. */
export type NoteContent = { body: string; format?: "html" };

/** `link` and `tool` share the same content shape. */
export type ItemContent =
  | LinkContent
  | PromptContent
  | ScreenshotContent
  | NoteContent;

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("collections_user_id_idx").on(t.userId)],
);

export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    type: text("type", { enum: ITEM_TYPES }).notNull(),
    title: text("title").notNull(),
    content: jsonb("content").$type<ItemContent>().notNull(),
    tags: text("tags").array().notNull().default([]),
    collectionId: uuid("collection_id").references(() => collections.id, {
      onDelete: "set null",
    }),
    isFavorite: boolean("is_favorite").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("items_user_id_idx").on(t.userId),
    index("items_collection_id_idx").on(t.collectionId),
    index("items_tags_idx").using("gin", t.tags),
  ],
);

export const accessTokens = pgTable(
  "access_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    tokenHash: text("token_hash").notNull(), // sha-256 hex, never store raw
    label: text("label"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  },
  (t) => [
    index("access_tokens_user_id_idx").on(t.userId),
    index("access_tokens_token_hash_idx").on(t.tokenHash),
  ],
);

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type AccessToken = typeof accessTokens.$inferSelect;
export type NewAccessToken = typeof accessTokens.$inferInsert;
