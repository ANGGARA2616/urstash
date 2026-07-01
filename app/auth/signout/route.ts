import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Sign out and return to /login. Triggered by a form POST. */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
