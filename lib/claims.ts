import { syncCoachIdentity } from "./coaches-db";
import type { Profile } from "./db";
import { emailShell, sendEmail } from "./email";
import { supabaseAdmin } from "./supabase/server";

/**
 * Handing a curated listing to the person it describes.
 *
 * A listing is only handed over automatically when the account's email matches
 * the email already on the listing — that match is the same evidence the admin
 * review looks for, so when we have it the review adds nothing. Without it the
 * claim still goes to review, because otherwise anyone holding a share link
 * could take over any unclaimed listing.
 */

/**
 * Claim intent rides in a cookie rather than a `next` param: a brand-new
 * account is routed to /role by the auth callback, which drops `next`, so the
 * claim would be lost exactly in the case this flow exists for.
 */
export const COACH_CLAIM_COOKIE = "pending_coach_claim";

/**
 * Someone who arrived to claim a listing has already answered the only two
 * questions signup asks: they coach, and their listing is their profile.
 * Asking them anyway — "looking to coach or be coached?", then the whole
 * member wizard — reads as a form standing between them and work they can see
 * is already done, so claiming settles both here.
 *
 * `becomesCoach` is false while a claim is still in review: the role waits for
 * the approval that hands them the listing, but they still skip the wizard.
 * An account that has already picked a role keeps it — claiming a listing
 * shouldn't quietly turn a member into a coach.
 */
export async function adoptClaimant(
  profile: Profile,
  { becomesCoach }: { becomesCoach: boolean },
): Promise<Profile> {
  if (profile.role_chosen) return profile;
  const patch = {
    ...(becomesCoach ? { role: "coach" as const } : {}),
    role_chosen: true,
    onboarding_complete: true,
  };
  await supabaseAdmin().from("profiles").update(patch).eq("id", profile.id);
  return { ...profile, ...patch };
}

export type ClaimOutcome =
  /** Linked to the account there and then. */
  | "claimed"
  /** Recorded for review; the admin was emailed. */
  | "pending"
  /** Already claimed, or no such listing. */
  | "unavailable";

type Claimant = { id: string; name: string | null; email: string | null };

function sameEmail(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export async function claimListing(coachId: string, user: Claimant): Promise<ClaimOutcome> {
  const admin = supabaseAdmin();
  const { data: coach } = await admin.from("coaches").select("*").eq("id", coachId).maybeSingle();
  if (!coach || coach.status !== "unclaimed" || coach.profile_id) return "unavailable";

  if (sameEmail(coach.email, user.email)) {
    await admin
      .from("coaches")
      .update({ profile_id: user.id, status: "approved" })
      .eq("id", coachId);
    await syncCoachIdentity(user.id);
    // Only one person owns a slot — settle any requests others had open on it.
    await admin
      .from("coach_claims")
      .update({ status: "rejected" })
      .eq("coach_id", coachId)
      .eq("status", "pending");

    if (user.email) {
      const firstName = (user.name ?? "there").split(" ")[0];
      await sendEmail({
        to: user.email,
        subject: "Your coach listing is now yours on onward/upward",
        html: emailShell(
          `${firstName}, it's official.`,
          `<p>We matched your email to the listing, so it's now linked to your
           account. Edit it any time from your profile's Coach card.</p>`,
          { label: "View your listing", url: "https://onwardupward.io/profile?side=coach" },
        ),
      });
    }
    return "claimed";
  }

  const { data: existing } = await admin
    .from("coach_claims")
    .select("id")
    .eq("coach_id", coachId)
    .eq("profile_id", user.id)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) return "pending";

  await admin.from("coach_claims").insert({ coach_id: coachId, profile_id: user.id });
  await sendEmail({
    to: "r@rongoldin.com",
    subject: `Claim request: ${coach.full_name}`,
    html: emailShell(
      "Someone wants to claim a coach slot.",
      `<p><strong style="color:#efe9dd">${user.name ?? "A member"}</strong> (${user.email ?? "no email"})
       says they're <strong style="color:#efe9dd">${coach.full_name}</strong> (listing email on file:
       ${coach.email ?? "none"}).</p>
       <p style="margin-top:12px">Their email doesn't match the listing, so this needs a look before
       approving.</p>`,
      { label: "Review the claim", url: "https://onwardupward.io/admin/waitlist" },
    ),
  });
  return "pending";
}
