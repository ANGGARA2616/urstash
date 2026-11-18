import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Completes magic-link / email-confirmation sign-in by exchanging the code for a session. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const baseUrl =
    forwardedHost && process.env.NODE_ENV === "production"
      ? `${forwardedProto}://${forwardedHost}`
      : origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=auth`);
}
