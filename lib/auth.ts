import { createHash, randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accessTokens } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export type AuthedUser = { id: string };

/** sha-256 hex. We store only the hash of an access token, never the raw value. */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Generate a new raw access token (shown to the user once). */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Resolve the acting user from either:
 *   1. an `Authorization: Bearer <token>` header (extension — Phase 1), or
 *   2. the Supabase cookie session (web app — Phase 0).
 * Returns null when unauthenticated. Branch (1) is dormant until Phase 1 but
 * wired now so /api is reachable by both without rework.
 */
export async function resolveUser(request: Request): Promise<AuthedUser | null> {
  const authz = request.headers.get("authorization");
  if (authz?.startsWith("Bearer ")) {
    const raw = authz.slice(7).trim();
    if (!raw) return null;
    const tokenHash = hashToken(raw);
    const [row] = await db
      .select({ userId: accessTokens.userId })
      .from(accessTokens)
      .where(eq(accessTokens.tokenHash, tokenHash))
      .limit(1);
    if (!row) return null;
    // Best-effort last-used touch (don't block the request on it failing).
    void db
      .update(accessTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(accessTokens.tokenHash, tokenHash));
    return { id: row.userId };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id } : null;
}

/** Cookie-session user for Server Components (no Request object available). */
export async function getSessionUser(): Promise<AuthedUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id } : null;
}

type RouteParams = Record<string, string>;

/**
 * Wrap a route handler so it (a) requires an authenticated user and (b) hands
 * that user to the handler. Every DB query inside MUST still filter by user.id —
 * this is the single source of truth for per-user scoping (Drizzle bypasses RLS).
 */
export function withUser<P extends RouteParams = RouteParams>(
  handler: (
    request: Request,
    ctx: { user: AuthedUser; params: P },
  ) => Promise<Response> | Response,
) {
  return async (
    request: Request,
    routeCtx?: { params: Promise<P> },
  ): Promise<Response> => {
    const user = await resolveUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const params = routeCtx ? await routeCtx.params : ({} as P);
    return handler(request, { user, params });
  };
}
