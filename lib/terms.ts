import type { Profile } from "./db";
import { supabaseAdmin } from "./supabase/server";

/**
 * Whether they agreed at sign-up (joined past the Terms notice), carried
 * across the round trip to Google.
 *
 * A cookie rather than a query param on the callback: the callback URL is
 * built by Supabase and comes back from Google, so anything we want to
 * survive the handshake has to be stored on our side first. /auth/google sets
 * it, /auth/callback stamps the profile and clears it.
 */
export const TERMS_COOKIE = "terms_accepted";

/**
 * Stamps the acceptance once. Never overwrites an existing timestamp — the
 * question is when someone first agreed, and signing in again isn't a new
 * agreement.
 */
export async function recordTermsAcceptance(profile: Profile): Promise<void> {
  if (profile.terms_accepted_at) return;
  await supabaseAdmin()
    .from("profiles")
    .update({ terms_accepted_at: new Date().toISOString() })
    .eq("id", profile.id);
}
