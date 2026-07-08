import { z } from "zod";
import { ITEM_TYPES, type ItemType } from "@/db/schema";

/* ---- per-type `content` shapes (mirror db/schema.ts) ---- */

export const linkContentSchema = z.object({
  url: z.string().url(),
  favicon: z.string().optional(),
  screenshotUrl: z.string().optional(),
  description: z.string().optional(),
});

export const promptContentSchema = z.object({
  promptText: z.string().min(1),
  targetAi: z.string().optional(),
  variables: z.array(z.string()).optional(),
});

export const screenshotContentSchema = z.object({
  imageUrl: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  styleTags: z.array(z.string()).optional(),
});

export const noteContentSchema = z.object({
  body: z.string().min(1),
  format: z.literal("html").optional(),
});

/** `link` and `tool` share the same content shape. */
export function contentSchemaFor(type: ItemType) {
  switch (type) {
    case "link":
    case "tool":
      return linkContentSchema;
    case "prompt":
      return promptContentSchema;
    case "screenshot":
      return screenshotContentSchema;
    case "note":
      return noteContentSchema;
  }
}

export const createItemSchema = z.object({
  type: z.enum(ITEM_TYPES),
  title: z.string().min(1).max(500),
  content: z.record(z.string(), z.unknown()),
  tags: z.array(z.string()).default([]),
  collectionId: z.string().uuid().nullable().optional(),
  isFavorite: z.boolean().optional(),
});

export const updateItemSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  collectionId: z.string().uuid().nullable().optional(),
  isFavorite: z.boolean().optional(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
