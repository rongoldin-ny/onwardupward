"use server";

import { redirect } from "next/navigation";
import { homeFor, requireUser } from "@/lib/auth";
import { adoptClaimant, claimListing } from "@/lib/claims";
import { syncCoachIdentity } from "@/lib/coaches-db";
import { emailShell, sendEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Profile } from "@/lib/db";
import { requireVetter } from "@/lib/vetting";

/**
 * Signed-in member taps "This you? Claim your slot". Same rules as the signup
 * route: an email matching the listing hands it over now, anything else goes
 * to review.
 */
export async function claimCoach(coachId: string): Promise<void> {
  const user = await requireUser();
  if (user.role !== "candidate" && user.role !== "coach") redirect(`/coaches/${coachId}`);

  const outcome = await claimListing(coachId, user);
  if (outcome !== "claimed") redirect(`/coaches/${coachId}`);
  // Home, not the profile editor: the listing is theirs now, and home is
  // where the "Complete your coaching profile" card lives. adoptClaimant is a
  // no-op for an account that already picked a role — it's here so one that
  // hasn't doesn't get sent into the member wizard by homeFor.
  const fresh = await adoptClaimant(user, { becomesCoach: user.role === "coach" });
  redirect(`${homeFor(fresh)}?welcome=coach`);
}

/** Hand the listing over to the claimant: link the profile, sync their identity in, and notify them. */
export async function approveClaim(claimId: string): Promise<void> {
  await requireVetter();
  const admin = supabaseAdmin();

  const { data: claim } = await admin
    .from("coach_claims")
    .select("*")
    .eq("id", claimId)
    .maybeSingle();
  if (!claim || claim.status !== "pending") redirect("/admin/waitlist");

  const { data } = await admin
    .from("profiles")
    .select("*")
    .eq("id", claim.profile_id)
    .maybeSingle();
  const profile = data as Profile | null;

  await admin
    .from("coaches")
    .update({ profile_id: claim.profile_id, status: "approved" })
    .eq("id", claim.coach_id);
  await syncCoachIdentity(claim.profile_id);
  // The listing is theirs now, so the account becomes a coach account — a
  // claim approved days later shouldn't drop them back at the role picker.
  if (profile) await adoptClaimant(profile, { becomesCoach: true });
  await admin.from("coach_claims").update({ status: "approved" }).eq("id", claimId);
  // Only one person can own a slot — clear out any other pending requests for it.
  await admin
    .from("coach_claims")
    .update({ status: "rejected" })
    .eq("coach_id", claim.coach_id)
    .eq("status", "pending");

  if (profile?.email) {
    const firstName = (profile.name ?? "there").split(" ")[0];
    await sendEmail({
      to: profile.email,
      subject: "Your coach listing is now yours on onward/upward",
      html: emailShell(
        `${firstName}, it's official.`,
        `<p>We confirmed your claim — that coach listing is now linked to your account.
         Edit it any time from your profile's Coach card.</p>`,
        { label: "View your listing", url: "https://onwardupward.io/profile?side=coach" },
      ),
    });
  }
  redirect("/admin/waitlist");
}

/** Turn a claim down, with an optional personal note in the email. */
export async function rejectClaim(claimId: string, formData: FormData): Promise<void> {
  await requireVetter();
  const admin = supabaseAdmin();

  const { data: claim } = await admin
    .from("coach_claims")
    .select("*")
    .eq("id", claimId)
    .maybeSingle();
  if (!claim || claim.status !== "pending") redirect("/admin/waitlist");

  await admin.from("coach_claims").update({ status: "rejected" }).eq("id", claimId);

  const { data: profile } = await admin
    .from("profiles")
    .select("name, email")
    .eq("id", claim.profile_id)
    .maybeSingle();
  const note = String(formData.get("note") ?? "").trim();
  if (profile?.email) {
    const firstName = (profile.name ?? "there").split(" ")[0];
    await sendEmail({
      to: profile.email,
      subject: "About your coach claim on onward/upward",
      html: emailShell(
        `${firstName}, about your claim.`,
        `<p>We couldn't confirm your claim on that coach listing.</p>${
          note ? `<p style="margin-top:12px">${note}</p>` : ""
        }`,
      ),
    });
  }
  redirect("/admin/waitlist");
}
