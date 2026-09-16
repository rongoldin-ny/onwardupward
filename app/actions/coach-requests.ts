"use server";

import { requireUser } from "@/lib/auth";
import { getCoachByProfileId } from "@/lib/coaches-db";
import { emailShell, sendEmail } from "@/lib/email";
import { hasPublicProfile } from "@/lib/profile-required";
import { supabaseAdmin } from "@/lib/supabase/server";
import { labelForCareerStage, labelForRoleType } from "@/lib/taxonomy";

const MAX_MESSAGE = 2000;
/** Requests any one member can send across all coaches in 24 hours. */
const DAILY_LIMIT = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Member-authored text → paragraphs, escaped so it can't break the email. */
function toParagraphs(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 10px">${escapeHtml(p.trim()).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

/**
 * A member asks a claimed coach to work with them. Sent from the platform so
 * neither side has to hand over an address first, with the member's profile
 * attached as context — a coach shouldn't have to answer "who is this?".
 * Replies go straight back to the member.
 */
export async function requestCoaching(
  coachId: string,
  message: string,
): Promise<{ error?: string }> {
  const user = await requireUser();
  const body = message.trim().slice(0, MAX_MESSAGE);
  if (!body) return { error: "Write a short note first." };

  const admin = supabaseAdmin();
  const { data: coach } = await admin
    .from("coaches")
    .select("id, full_name, email, profile_id, status")
    .eq("id", coachId)
    .maybeSingle();
  if (!coach || coach.status !== "approved" || !coach.profile_id) {
    return { error: "That coach isn't taking requests right now." };
  }
  if (coach.profile_id === user.id) return { error: "That's your own listing." };

  // Rate limit off the request events themselves (tagged via: "request" —
  // "Or book directly" link clicks share kind "book" and mustn't count):
  // one per coach and DAILY_LIMIT overall per rolling 24 hours.
  const { data: recent } = await admin
    .from("analytics_events")
    .select("metadata")
    .eq("user_id", user.id)
    .eq("event_type", "coach_view")
    .eq("metadata->>kind", "book")
    .eq("metadata->>via", "request")
    .gte("created_at", new Date(Date.now() - DAY_MS).toISOString());
  const sentToday = (recent ?? []) as { metadata: { coach_id?: string } }[];
  const coachFirstName = (coach.full_name ?? "this coach").split(" ")[0];
  if (sentToday.some((e) => e.metadata.coach_id === coach.id)) {
    return { error: `You've already messaged ${coachFirstName} today — give them a chance to reply.` };
  }
  if (sentToday.length >= DAILY_LIMIT) {
    return { error: `You've sent ${DAILY_LIMIT} requests today — try again tomorrow.` };
  }

  // The account email is authoritative for a claimed listing; the seeded one
  // is only a fallback for listings claimed before an email was recorded.
  const { data: owner } = await admin
    .from("profiles")
    .select("email")
    .eq("id", coach.profile_id)
    .maybeSingle();
  const to = (owner?.email as string | null) ?? coach.email;
  if (!to) return { error: "We couldn't reach that coach — try again later." };

  const facts = [
    // Guarded: labelForRoleType falls back to "Product Design" for an unset
    // role, which would assert something about them that isn't true.
    user.role_type && `Role: ${labelForRoleType(user.role_type)}`,
    labelForCareerStage(user.career_stage) && `Stage: ${labelForCareerStage(user.career_stage)}`,
    user.location_country && `Based in: ${user.location_country}`,
    user.years_experience !== null && `Experience: ${user.years_experience} years`,
    user.last_role_text && `Recently: ${user.last_role_text}`,
    user.growth_goal && `Hoping to grow: ${user.growth_goal}`,
    user.dream_job && `Aiming for: ${user.dream_job}`,
  ].filter((f): f is string => !!f);

  // Only link the share page when it will actually render for the coach.
  const listing = await getCoachByProfileId(user.id);
  const profileLink = hasPublicProfile(user, { approvedCoach: listing?.status === "approved" })
    ? `<p style="margin:14px 0 0;font-size:13px">
        <a href="https://onwardupward.io/p/${user.id}" style="color:#e8c987">See their full profile →</a>
      </p>`
    : "";

  const context = `
    <div style="margin-top:24px;border-top:1px solid #2e2e34;padding-top:20px">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8d8677">
        About ${escapeHtml(user.name ?? "them")}
      </p>
      ${facts
        .map(
          (f) =>
            `<p style="margin:0 0 6px;font-size:14px;color:#c9c2b2">${escapeHtml(f)}</p>`,
        )
        .join("")}
      ${profileLink}
    </div>`;

  const sent = await sendEmail({
    to,
    replyTo: user.email ?? undefined,
    subject: `${user.name ?? "A member"} would like to work with you`,
    html: emailShell(
      `${(coach.full_name ?? "there").split(" ")[0]}, a member reached out.`,
      `${toParagraphs(body)}${context}
       <p style="margin-top:18px;font-size:13px;color:#8d8677">Reply to this email and it goes
        straight back to them.</p>`,
    ),
  });
  if (!sent) return { error: "We couldn't send that just now — try again." };

  await admin.from("analytics_events").insert({
    user_id: user.id,
    event_type: "coach_view",
    metadata: { coach_id: coach.id, coach: coach.full_name, kind: "book", via: "request" },
  });

  return {};
}
