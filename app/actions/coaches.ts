"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCoachByProfileId, TARGET_MENTEE_OPTIONS } from "@/lib/coaches-db";
import { emailShell, sendEmail } from "@/lib/email";
import { normalizeUrl } from "@/lib/extract";
import { supabaseAdmin } from "@/lib/supabase/server";
import { saveImage } from "@/lib/uploads";
import { requireVetter } from "@/lib/vetting";

/** Email addresses become mailto links; anything else must be a valid URL. */
function normalizeBooking(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("mailto:")) return trimmed;
  if (/^\S+@\S+\.\S+$/.test(trimmed)) return `mailto:${trimmed}`;
  return normalizeUrl(trimmed);
}

/**
 * Create or update the signed-in user's coach listing (candidate hybrids and
 * standalone coach accounts). First save applies as pending + notifies Ron;
 * later edits keep the current status.
 */
export async function saveCoachListing(formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();
  if (user.role !== "candidate" && user.role !== "coach") {
    return { error: "Coach listings are for members and coaches." };
  }

  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const fullName = str("full_name");
  const email = str("email");
  const shortDescription = str("short_description");
  const offering = str("offering");
  const bestFor = str("best_for");
  const mentees = formData
    .getAll("target_mentees")
    .map(String)
    .filter((m) => (TARGET_MENTEE_OPTIONS as readonly string[]).includes(m));
  const disciplinesRaw = str("disciplines");
  const disciplines = (["design", "product", "both"] as const).includes(disciplinesRaw as any)
    ? (disciplinesRaw as "design" | "product" | "both")
    : null;
  const booking = normalizeBooking(str("booking_url"));

  if (!fullName || !email || !shortDescription || !offering || !bestFor) {
    return { error: "Name, email, description, offering, and best-for are all required." };
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "That email doesn't look right." };
  if (!disciplines) return { error: "Pick which disciplines you coach for." };
  if (mentees.length === 0) return { error: "Pick at least one group you mentor." };
  if (!booking) return { error: "Add a booking link — a URL or an email address." };

  const website = str("website") ? normalizeUrl(str("website")) : null;

  const existing = await getCoachByProfileId(user.id);
  let photoUrl = existing?.photo_url ?? user.photo_url ?? null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    photoUrl = (await saveImage(photo, user.id)) ?? photoUrl;
  }
  if (!photoUrl) return { error: "Add a photo or logo." };

  const row = {
    profile_id: user.id,
    full_name: fullName,
    email,
    short_description: shortDescription,
    offering,
    target_mentees: mentees,
    disciplines,
    best_for: bestFor,
    photo_url: photoUrl,
    booking_url: booking,
    website,
    company: str("company") || null,
    pricing: str("pricing") || null,
  };

  const admin = supabaseAdmin();
  if (existing) {
    const { error } = await admin.from("coaches").update(row).eq("id", existing.id);
    if (error) return { error: "Couldn't save — try again." };
  } else {
    const { error } = await admin.from("coaches").insert({ ...row, status: "pending" });
    if (error) return { error: "Couldn't save — try again." };
    await sendEmail({
      to: "r@rongoldin.com",
      subject: `New coach application: ${fullName}`,
      html: emailShell(
        "A coach wants on the bench.",
        `<p><strong style="color:#efe9dd">${fullName}</strong> (${email}) applied to
         coach on onward/upward.</p>
         <p style="margin-top:10px">${shortDescription}</p>`,
        { label: "Review the waitlist", url: "https://onwardupward.io/admin/waitlist" },
      ),
    });
  }

  // A coach account's first listing save completes their onboarding.
  if (user.role === "coach" && !user.onboarding_complete) {
    await admin.from("profiles").update({ onboarding_complete: true }).eq("id", user.id);
  }
  return {};
}

/** Approve a pending coach: live + bookable immediately, with a welcome email. */
export async function approveCoach(coachId: string): Promise<void> {
  await requireVetter();
  const admin = supabaseAdmin();
  const { data } = await admin.from("coaches").select("*").eq("id", coachId).maybeSingle();
  if (!data) redirect("/admin/waitlist");

  if (data.status !== "approved") {
    await admin.from("coaches").update({ status: "approved" }).eq("id", coachId);
    if (data.email) {
      const firstName = String(data.full_name ?? "there").split(" ")[0];
      await sendEmail({
        to: data.email,
        subject: "Your coach listing is live on onward/upward",
        html: emailShell(
          `${firstName}, you're on the bench.`,
          `<p>Your coach listing has been approved. Members can now find you in
           the coaches directory and book sessions through your link.</p>`,
          { label: "See your listing", url: "https://onwardupward.io/coaches" },
        ),
      });
    }
  }
  redirect("/admin/waitlist");
}
