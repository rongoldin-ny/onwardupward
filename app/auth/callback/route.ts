import { NextResponse, type NextRequest } from "next/server";
import { supabaseRoute } from "@/lib/supabase/server";
import { arrivalFor } from "@/lib/arrival";
import { COACH_CLAIM_COOKIE } from "@/lib/claims";
import type { Profile } from "@/lib/db";
import { recordTermsAcceptance, TERMS_COOKIE } from "@/lib/terms";

/**
 * Where Google sends people back to. Trades the one-time code for a session,
 * then routes them onward — see arrivalFor.
 */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/signin?error=${reason}`, origin));

  // Google reports a declined consent screen as ?error=access_denied.
  if (searchParams.get("error")) return fail("google-cancelled");
  if (!code) return fail("google");

  const { supabase, applyCookies } = supabaseRoute(request);
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return fail("google");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("google");

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = data as Profile | null;

  // No profile row means the signup trigger didn't fire — don't strand them
  // on a blank page pretending they're signed in.
  if (!profile) return fail("google");

  if (request.cookies.get(TERMS_COOKIE)?.value) {
    await recordTermsAcceptance(profile).catch(() => {});
  }

  const claimCoachId = request.cookies.get(COACH_CLAIM_COOKIE)?.value;
  const destination = await arrivalFor(profile, { claimCoachId, next });

  const response = NextResponse.redirect(new URL(destination, origin));
  applyCookies(response);
  if (claimCoachId) response.cookies.delete(COACH_CLAIM_COOKIE);
  response.cookies.delete(TERMS_COOKIE);
  return response;
}
