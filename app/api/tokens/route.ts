import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { accessTokens } from "@/db/schema";
import { generateToken, hashToken, withUser } from "@/lib/auth";

/** GET /api/tokens — metadata only, never the hash. */
export const GET = withUser(async (_request, { user }) => {
  const rows = await db
    .select({
      id: accessTokens.id,
      label: accessTokens.label,
      createdAt: accessTokens.createdAt,
      lastUsedAt: accessTokens.lastUsedAt,
    })
    .from(accessTokens)
    .where(eq(accessTokens.userId, user.id))
    .orderBy(desc(accessTokens.createdAt));
  return Response.json({ tokens: rows });
});

const createTokenSchema = z.object({
  label: z.string().max(120).optional(),
});

/** POST /api/tokens — create a token; the raw value is returned exactly once. */
export const POST = withUser(async (request, { user }) => {
  const body = await request.json().catch(() => ({}));
  const parsed = createTokenSchema.safeParse(body ?? {});
  const label = parsed.success ? (parsed.data.label ?? null) : null;

  const raw = generateToken();
  const [row] = await db
    .insert(accessTokens)
    .values({ userId: user.id, tokenHash: hashToken(raw), label })
    .returning({
      id: accessTokens.id,
      label: accessTokens.label,
      createdAt: accessTokens.createdAt,
    });

  // `token` is shown once and never retrievable again.
  return Response.json({ token: raw, record: row }, { status: 201 });
});
