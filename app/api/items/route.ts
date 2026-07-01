import { db } from "@/db";
import { items } from "@/db/schema";
import { withUser } from "@/lib/auth";
import { contentSchemaFor, createItemSchema } from "@/lib/content-schemas";
import { listItems } from "@/lib/queries";

/** GET /api/items?q=&type=&tag=&collection=&favorite= — list + search + filters. */
export const GET = withUser(async (request, { user }) => {
  const { searchParams } = new URL(request.url);
  const rows = await listItems(user.id, {
    q: searchParams.get("q"),
    type: searchParams.get("type"),
    tag: searchParams.get("tag"),
    collection: searchParams.get("collection"),
    favorite: searchParams.get("favorite") === "true",
  });
  return Response.json({ items: rows });
});

/** POST /api/items — create an item (validated per type). */
export const POST = withUser(async (request, { user }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid item", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { type, title, content, tags, collectionId, isFavorite } = parsed.data;
  const contentParsed = contentSchemaFor(type).safeParse(content);
  if (!contentParsed.success) {
    return Response.json(
      {
        error: `Invalid content for type "${type}"`,
        details: contentParsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const [row] = await db
    .insert(items)
    .values({
      userId: user.id,
      type,
      title,
      content: contentParsed.data,
      tags,
      collectionId: collectionId ?? null,
      isFavorite: isFavorite ?? false,
    })
    .returning();

  return Response.json({ item: row }, { status: 201 });
});
