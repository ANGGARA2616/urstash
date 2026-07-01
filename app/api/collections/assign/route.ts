import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { collections, items } from "@/db/schema";
import { withUser } from "@/lib/auth";

const assignSchema = z
  .object({
    itemIds: z.array(z.string().uuid()).min(1),
    collectionId: z.string().uuid().nullable().optional(),
    newCollectionName: z.string().min(1).max(200).optional(),
  })
  .refine((d) => d.newCollectionName || d.collectionId !== undefined, {
    message: "Provide collectionId (or null) or newCollectionName",
  });

/**
 * POST /api/collections/assign — set collectionId on many items at once.
 * Pass `newCollectionName` to create a collection and assign in one step,
 * `collectionId` to use an existing one, or `collectionId: null` to remove.
 */
export const POST = withUser(async (request, { user }) => {
  const body = await request.json().catch(() => null);
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { itemIds, newCollectionName } = parsed.data;
  let collectionId = parsed.data.collectionId ?? null;

  if (newCollectionName) {
    const [col] = await db
      .insert(collections)
      .values({ userId: user.id, name: newCollectionName })
      .returning({ id: collections.id });
    collectionId = col.id;
  } else if (collectionId) {
    // Verify the target collection belongs to this user.
    const [col] = await db
      .select({ id: collections.id })
      .from(collections)
      .where(
        and(eq(collections.id, collectionId), eq(collections.userId, user.id)),
      )
      .limit(1);
    if (!col) {
      return Response.json({ error: "Collection not found" }, { status: 404 });
    }
  }

  const updated = await db
    .update(items)
    .set({ collectionId, updatedAt: new Date() })
    .where(and(inArray(items.id, itemIds), eq(items.userId, user.id)))
    .returning({ id: items.id });

  return Response.json({ collectionId, updated: updated.length });
});
