/** Item type discriminator. Kept drizzle-free so client components can import it. */
export const ITEM_TYPES = [
  "link",
  "prompt",
  "tool",
  "screenshot",
  "note",
] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

/** Supabase Storage bucket for screenshots / uploaded images. */
export const MEDIA_BUCKET = "media";
