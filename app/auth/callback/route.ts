import { NextResponse, type NextRequest } from "next/server";
import { supabaseRoute } from "@/lib/supabase/server";
import { homeFor } from "@/lib/auth";
import { adoptClaimant, claimListing, COACH_CLAIM_COOKIE } from "@/lib/claims";
import type { Profile } from "@/lib/db";

/**
 * Where Google sends people back to. Trades the one-time code for a session,
 * then routes them onward: brand-new accounts pick a role, everyone else
 * lands on their usual home.
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
  let profile = data as Profile | null;

  // No profile row means the signup trigger didn't fire — don't strand them
  // on a blank page pretending they're signed in.
  if (!profile) return fail("google");

  // Arriving from a shared coach listing they say is theirs. Settled here
  // because it's the one point that runs exactly once per sign-in and the
  // account definitely exists — /role and the wizard can both be abandoned.
  const claimCoachId = request.cookies.get(COACH_CLAIM_COOKIE)?.value;
  let claimed = false;
  if (claimCoachId) {
    claimed = (await claimListing(claimCoachId, profile).catch(() => "unavailable")) === "claimed";
    // Settles their role and skips the member wizard — see adoptClaimant.
    profile = await adoptClaimant(profile, { becomesCoach: claimed });
  }

  // A claimant is never sent to the role picker: they told us who they are by
  // claiming. Everyone else who has never picked a role still goes to /role —
  // keying that off onboarding_complete would send anyone who abandoned the
  // wizard back to the picker on every single sign-in.
  const destination = claimCoachId
    ? claimed
      ? // Their own home — the coach home for a brand-new claimant, the member
        // home for someone who already had an account. Both carry the card
        // that finishes the listing off.
        `${homeFor(profile)}?welcome=coach`
      : `/coaches/${claimCoachId}?welcome=claim`
    : !profile.role_chosen
      ? "/role"
      : next?.startsWith("/")
        ? next
        : homeFor(profile);

  const response = NextResponse.redirect(new URL(destination, origin));
  applyCookies(response);
  if (claimCoachId) response.cookies.delete(COACH_CLAIM_COOKIE);
  return response;
}
