import { eq } from "drizzle-orm";
import { db } from "@/db";
import { collections, items } from "@/db/schema";
import { withUser } from "@/lib/auth";

/** GET /api/export — full JSON dump of the user's data (data-ownership requirement). */
export const GET = withUser(async (_request, { user }) => {
  const [itemRows, collectionRows] = await Promise.all([
    db.select().from(items).where(eq(items.userId, user.id)),
    db.select().from(collections).where(eq(collections.userId, user.id)),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    collections: collectionRows,
    items: itemRows,
  };

  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="stash-export-${date}.json"`,
    },
  });
});
