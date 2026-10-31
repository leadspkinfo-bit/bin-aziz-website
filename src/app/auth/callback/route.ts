import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google sends the visitor back here with a one-time code; swap it for a session cookie.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/packages";
  // Only allow same-site relative paths to avoid open redirects.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/packages";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
    console.error("auth callback failed:", error.message);
  }
  return NextResponse.redirect(`${origin}/login?error=1`);
}
