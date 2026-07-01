import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accessTokens } from "@/db/schema";
import { withUser } from "@/lib/auth";

type Params = { id: string };

/** DELETE /api/tokens/[id] — revoke a token. */
export const DELETE = withUser<Params>(async (_request, { user, params }) => {
  const [row] = await db
    .delete(accessTokens)
    .where(
      and(eq(accessTokens.id, params.id), eq(accessTokens.userId, user.id)),
    )
    .returning({ id: accessTokens.id });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
});
