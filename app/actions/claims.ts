"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { syncCoachIdentity } from "@/lib/coaches-db";
import { emailShell, sendEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireVetter } from "@/lib/vetting";

/** Signed-in member taps "This you? Claim your slot" — records the request and emails Ron to review. */
export async function claimCoach(coachId: string): Promise<void> {
  const user = await requireUser();
  if (user.role !== "candidate" && user.role !== "coach") redirect(`/coaches/${coachId}`);

  const admin = supabaseAdmin();
  const { data: coach } = await admin.from("coaches").select("*").eq("id", coachId).maybeSingle();
  if (!coach || coach.status !== "unclaimed") redirect(`/coaches/${coachId}`);

  const { data: existing } = await admin
    .from("coach_claims")
    .select("id")
    .eq("coach_id", coachId)
    .eq("profile_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (!existing) {
    await admin.from("coach_claims").insert({ coach_id: coachId, profile_id: user.id });
    await sendEmail({
      to: "r@rongoldin.com",
      subject: `Claim request: ${coach.full_name}`,
      html: emailShell(
        "Someone wants to claim a coach slot.",
        `<p><strong style="color:#efe9dd">${user.name ?? "A member"}</strong> (${user.email ?? "no email"})
         says they're <strong style="color:#efe9dd">${coach.full_name}</strong> (listing email on file:
         ${coach.email ?? "none"}).</p>
         <p style="margin-top:12px">Compare their profile and email against the coach card before approving.</p>`,
        { label: "Review the claim", url: "https://onwardupward.io/admin/waitlist" },
      ),
    });
  }
  redirect(`/coaches/${coachId}`);
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

  const { data: profile } = await admin
    .from("profiles")
    .select("id, name, email")
    .eq("id", claim.profile_id)
    .maybeSingle();

  await admin
    .from("coaches")
    .update({ profile_id: claim.profile_id, status: "approved" })
    .eq("id", claim.coach_id);
  await syncCoachIdentity(claim.profile_id);
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
