import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 renamed middleware.ts -> proxy.ts (exported fn: `proxy`, Node runtime).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on all paths EXCEPT:
     * - /api (handles its own session-or-Bearer auth via lib/auth.ts)
     * - Next internals and static assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
