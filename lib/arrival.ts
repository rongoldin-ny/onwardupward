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
  if (claimCoachId) {
    // Their own home — the coach home for a brand-new claimant, the member
    // home for someone who already had an account. Both carry the card that
    // finishes the listing off.
    return claimed ? `${homeFor(profile)}?welcome=coach` : `/coaches/${claimCoachId}?welcome=claim`;
  }
  if (!profile.role_chosen) return "/role";
  return safeNext(next) ?? homeFor(profile);
}
