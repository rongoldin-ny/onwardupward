"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  FORMAT_OPTIONS,
  FORMAT_OTHER,
  normalizeCertifications,
  coachMissing,
  type CoachRow,
} from "@/lib/coach-shared";
import { getCoachByProfileId, TARGET_MENTEE_OPTIONS } from "@/lib/coaches-db";
import { emailShell, sendEmail } from "@/lib/email";
import { normalizeUrl } from "@/lib/extract";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ROLE_TYPES } from "@/lib/taxonomy";
import { requireVetter } from "@/lib/vetting";

/** Email addresses become mailto links; anything else must be a valid URL. */
function normalizeBooking(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("mailto:")) return trimmed;
  if (/^\S+@\S+\.\S+$/.test(trimmed)) return `mailto:${trimmed}`;
  return normalizeUrl(trimmed);
}

async function notifyCoachApplication(user: {
  name: string | null;
  email: string | null;
  bio: string | null;
}) {
  const fullName = user.name ?? "An unnamed coach";
  await sendEmail({
    to: "r@rongoldin.com",
    subject: `New coach application: ${fullName}`,
    html: emailShell(
      "A coach wants on the bench.",
      `<p><strong style="color:#efe9dd">${fullName}</strong> (${user.email ?? "no email"}) applied to
       coach on onward/upward.</p>
       <p style="margin-top:10px">${user.bio ?? ""}</p>`,
      { label: "Review the waitlist", url: "https://onwardupward.io/admin/waitlist" },
    ),
  });
}

/**
 * Create or update the signed-in user's coaching attributes. Identity (name,
 * email, photo, background, website) is mirrored from the profile — the
 * coaches row only owns what's specific to coaching. Lenient on purpose:
 * the profile page autosaves partial edits as a draft, and visibility is
 * gated by the required-field check, not here. Nothing is submitted for
 * review until `submit_for_review` is set (or `submitCoachApplication`).
 */
export async function saveCoachAttributes(
  formData: FormData,
): Promise<{ error?: string; coach?: CoachRow }> {
  const user = await requireUser();
  if (user.role !== "candidate" && user.role !== "coach") {
    return { error: "Coach listings are for members and coaches." };
  }

  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const submit = formData.get("submit_for_review") === "1";
  const mentees = formData
    .getAll("target_mentees")
    .map(String)
    .filter((m) => (TARGET_MENTEE_OPTIONS as readonly string[]).includes(m));
  const roleTypeValues = ROLE_TYPES.map((r) => r.value) as readonly string[];
  const specialties = formData
    .getAll("specialties")
    .map(String)
    .filter((s) => roleTypeValues.includes(s));
  const certifications = normalizeCertifications(formData.getAll("certifications").map(String));
  // Only meaningful alongside "Other"; dropping it otherwise keeps a stale
  // answer from resurfacing if they switch away and back.
  const certificationOther = certifications.includes("other")
    ? str("certification_other").slice(0, 120) || null
    : null;
  const formats = formData
    .getAll("formats")
    .map(String)
    .filter((f) => (FORMAT_OPTIONS as readonly string[]).includes(f));
  const bookingRaw = str("booking_url");
  const booking = bookingRaw ? normalizeBooking(bookingRaw) : null;
  if (bookingRaw && !booking) return { error: "That booking link doesn't look right." };
  const substackRaw = str("substack_url");
  const substackUrl = substackRaw ? normalizeUrl(substackRaw) : null;
  if (substackRaw && !substackUrl) return { error: "That newsletter link doesn't look right." };

  const existing = await getCoachByProfileId(user.id);
  const row = {
    profile_id: user.id,
    full_name: user.name ?? existing?.full_name ?? "Unnamed",
    email: user.email,
    photo_url: user.photo_url ?? existing?.photo_url ?? null,
    short_description: user.bio,
    website: user.website_url,
    title: str("title") || null,
    offering: str("offering") || null,
    target_mentees: mentees,
    formats,
    format_other: formats.includes(FORMAT_OTHER) ? str("format_other").slice(0, 120) || null : null,
    specialties,
    best_for: str("best_for") || null,
    certifications,
    certification_other: certificationOther,
    booking_url: booking,
    company: str("company") || null,
    pricing: str("pricing") || null,
    free_intro_call: formData.get("free_intro_call") === "on",
    pricing_on_call: formData.get("pricing_on_call") === "on",
    credentials: str("credentials") || null,
    substack_url: substackUrl,
  };

  const admin = supabaseAdmin();
  let saved: CoachRow | null = null;
  if (existing) {
    const becomesPending = submit && existing.status === "draft";
    const { data, error } = await admin
      .from("coaches")
      .update({ ...row, ...(becomesPending ? { status: "pending" } : {}) })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) {
      console.error("saveCoachAttributes update failed:", error.message);
      return { error: `Couldn't save your coaching card — ${error.message}` };
    }
    saved = data as CoachRow;
    if (becomesPending) await notifyCoachApplication(user);
  } else {
    const { data, error } = await admin
      .from("coaches")
      .insert({ ...row, status: submit ? "pending" : "draft" })
      .select("*")
      .single();
    if (error) {
      console.error("saveCoachAttributes insert failed:", error.message);
      return { error: `Couldn't save your coaching card — ${error.message}` };
    }
    saved = data as CoachRow;
    if (submit) await notifyCoachApplication(user);
  }

  // A coach account's first listing save completes their onboarding.
  if (user.role === "coach" && !user.onboarding_complete) {
    await admin.from("profiles").update({ onboarding_complete: true }).eq("id", user.id);
  }
  return { coach: saved };
}

/** Move a drafted coaching card to pending review and notify Ron. */
export async function submitCoachApplication(): Promise<{ error?: string; coach?: CoachRow }> {
  const user = await requireUser();
  const existing = await getCoachByProfileId(user.id);
  if (!existing) return { error: "Fill in your coaching card first." };
  if (existing.status !== "draft") return { coach: existing };
  const missing = coachMissing(existing);
  if (missing.length > 0) {
    return { error: `Add ${missing.map((m) => m.toLowerCase()).join(", ")} before submitting.` };
  }
  const { data, error } = await supabaseAdmin()
    .from("coaches")
    .update({ status: "pending" })
    .eq("id", existing.id)
    .select("*")
    .single();
  if (error) return { error: "Couldn't submit — try again." };
  await notifyCoachApplication(user);
  return { coach: data as CoachRow };
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

/** Turn a pending coach application down, with an optional personal note in the email. */
export async function rejectCoach(coachId: string, formData: FormData): Promise<void> {
  await requireVetter();
  const admin = supabaseAdmin();
  const { data } = await admin.from("coaches").select("*").eq("id", coachId).maybeSingle();
  if (!data) redirect("/admin/waitlist");

  if (data.status !== "rejected") {
    await admin.from("coaches").update({ status: "rejected" }).eq("id", coachId);
    const note = String(formData.get("note") ?? "").trim();
    if (data.email) {
      const firstName = String(data.full_name ?? "there").split(" ")[0];
      await sendEmail({
        to: data.email,
        subject: "About your onward/upward coach application",
        html: emailShell(
          `${firstName}, an update on your coach application.`,
          `<p>We reviewed your coach listing and it's not quite the right fit for the bench
           right now.</p>${note ? `<p style="margin-top:12px">${note}</p>` : ""}`,
        ),
      });
    }
  }
  redirect("/admin/waitlist");
}
