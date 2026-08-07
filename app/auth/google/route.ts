import { NextResponse, type NextRequest } from "next/server";
import { supabaseRoute } from "@/lib/supabase/server";

/**
 * Kicks off Google sign-in. The "Continue with Google" buttons are plain
 * <a> links pointing here — deliberately not next/link, which would prefetch
 * the URL on hover and start a throwaway OAuth handshake.
 *
 * Supabase builds the consent URL and stashes a PKCE code verifier in a
 * cookie; /auth/callback trades the returned code for a session.
 */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const next = searchParams.get("next");

  const callback = new URL("/auth/callback", origin);
  if (next?.startsWith("/")) callback.searchParams.set("next", next);

  const { supabase, applyCookies } = supabaseRoute(request);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callback.toString(),
      // Always let people pick which Google account to use — signing in with
      // the wrong one is otherwise invisible and annoying to undo.
      queryParams: { prompt: "select_account" },
    },
  });

  const response = NextResponse.redirect(
    error || !data.url ? new URL("/signin?error=google", origin) : data.url,
  );
  applyCookies(response);
  return response;
}
