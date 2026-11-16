import { adoptClaimant, claimListing } from "./claims";
import type { Profile } from "./db";
import { homeFor } from "./auth";

/** Only paths on this site: `//evil.com` and `/\evil.com` both leave it. */
export function safeNext(next: string | null | undefined): string | undefined {
  return next && /^\/(?![/\\])/.test(next) ? next : undefined;
}

/**
 * Where someone goes the moment they're signed in, however they got there —
 * Google, a confirmation link, or a password. Brand-new accounts pick a role,
 * everyone else lands on their usual home.
 *
 * `claimCoachId` settles a listing claim here because this runs exactly once
 * per sign-in and the account definitely exists — /role and the wizard can
 * both be abandoned. Only ever call this with a confirmed email: claimListing
 * hands a listing over on an email match.
 */
export async function arrivalFor(
  signedIn: Profile,
  { claimCoachId, next }: { claimCoachId?: string; next?: string | null },
): Promise<string> {
  let profile = signedIn;
  if (claimCoachId) {
    const outcome = await claimListing(claimCoachId, profile).catch(() => "unavailable" as const);
    // Only a claim that landed skips the role picker and the wizard: the email
    // matched the listing, so we know who they are. One still in review, or a
    // listing that's gone (or never existed), earns nothing. They sign up like
    // anyone else and wait to be let in, or a made-up claim link would be a
    // way around the waitlist.
    if (outcome === "claimed") {
      profile = await adoptClaimant(profile, { becomesCoach: true });
      return `${homeFor(profile)}?welcome=coach`;
    }
    // In review: show them the listing with its "claim pending" note. Anywhere
    // they go from there sends an unfinished account on to sign-up.
    if (outcome === "pending") return `/coaches/${claimCoachId}?welcome=claim`;
  }

  // Everyone else who has never picked a role goes to /role. Keying that off
  // onboarding_complete would send anyone who abandoned the wizard back to
  // the picker on every single sign-in.
  if (!profile.role_chosen) return "/role";
  return safeNext(next) ?? homeFor(profile);
}
