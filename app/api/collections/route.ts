import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { collections } from "@/db/schema";
import { withUser } from "@/lib/auth";

/** GET /api/collections */
export const GET = withUser(async (_request, { user }) => {
  const rows = await db
    .select()
    .from(collections)
    .where(eq(collections.userId, user.id))
    .orderBy(asc(collections.name));
  return Response.json({ collections: rows });
});

const createCollectionSchema = z.object({ name: z.string().min(1).max(200) });

/** POST /api/collections */
export const POST = withUser(async (request, { user }) => {
  const body = await request.json().catch(() => null);
  const parsed = createCollectionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid collection" }, { status: 400 });
  }
  const [row] = await db
    .insert(collections)
    .values({ userId: user.id, name: parsed.data.name })
    .returning();
  return Response.json({ collection: row }, { status: 201 });
});
