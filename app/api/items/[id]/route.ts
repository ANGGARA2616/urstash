import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { items, type ItemContent } from "@/db/schema";
import { withUser } from "@/lib/auth";
import { contentSchemaFor, updateItemSchema } from "@/lib/content-schemas";

type Params = { id: string };

/** GET /api/items/[id] */
export const GET = withUser<Params>(async (_request, { user, params }) => {
  const [row] = await db
    .select()
    .from(items)
    .where(and(eq(items.id, params.id), eq(items.userId, user.id)))
    .limit(1);
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ item: row });
});

/** PATCH /api/items/[id] — edit fields and/or toggle favorite. */
export const PATCH = withUser<Params>(async (request, { user, params }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid update", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [existing] = await db
    .select({ type: items.type })
    .from(items)
    .where(and(eq(items.id, params.id), eq(items.userId, user.id)))
    .limit(1);
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const { title, content, tags, collectionId, isFavorite } = parsed.data;
  const updates: Partial<typeof items.$inferInsert> = { updatedAt: new Date() };

  if (title !== undefined) updates.title = title;
  if (tags !== undefined) updates.tags = tags;
  if (isFavorite !== undefined) updates.isFavorite = isFavorite;
  if (collectionId !== undefined) updates.collectionId = collectionId;
  if (content !== undefined) {
    const contentParsed = contentSchemaFor(existing.type).safeParse(content);
    if (!contentParsed.success) {
      return Response.json(
        {
          error: `Invalid content for type "${existing.type}"`,
          details: contentParsed.error.flatten(),
        },
        { status: 400 },
      );
    }
    updates.content = contentParsed.data as ItemContent;
  }

  const [row] = await db
    .update(items)
    .set(updates)
    .where(and(eq(items.id, params.id), eq(items.userId, user.id)))
    .returning();

  return Response.json({ item: row });
});

/** DELETE /api/items/[id] */
export const DELETE = withUser<Params>(async (_request, { user, params }) => {
  const [row] = await db
    .delete(items)
    .where(and(eq(items.id, params.id), eq(items.userId, user.id)))
    .returning({ id: items.id });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
});
