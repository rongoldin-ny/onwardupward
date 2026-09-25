import { NextResponse, type NextRequest } from "next/server";
import { supabaseRoute } from "@/lib/supabase/server";

/**
 * Waitlisted accounts aren't kept signed in: there's nothing for them to use
 * yet. Anything that finds one signed in (a fresh Google sign-in, an old
 * session) sends them here, which quietly signs them out and shows where they
 * stand. A Route Handler because Server Components can't clear cookies.
 */
export async function GET(request: NextRequest) {
  const { supabase, applyCookies } = supabaseRoute(request);
  await supabase.auth.signOut();
  const response = NextResponse.redirect(new URL("/waitlist?listed=1", request.nextUrl.origin));
  applyCookies(response);
  return response;
}
