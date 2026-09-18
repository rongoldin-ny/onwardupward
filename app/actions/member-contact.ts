"use server";

import { requireUser } from "@/lib/auth";
import { getCoachByProfileId } from "@/lib/coaches-db";
import type { Profile } from "@/lib/db";
import { emailShell, escapeHtml, sendEmail, toParagraphs } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isVetter } from "@/lib/vetting";

const MAX_MESSAGE = 2000;
/** Notes any one coach can send across all members in 24 hours. */
const DAILY_LIMIT = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A coach reaches out to a member.
 *
 * The mirror of requestCoaching, and it exists for the same reason: nobody's
 * address is on their profile any more, so the platform carries the note and
 * the reply-to does the introducing. Only coaches may send, only to people who
 * left "Allow coaches to contact me" on, and at a rate a member's inbox can
 * live with.
 */
export async function contactMember(
  profileId: string,
  message: string,
): Promise<{ error?: string }> {
  const user = await requireUser();
  const body = message.trim().slice(0, MAX_MESSAGE);
  if (!body) return { error: "Write a short note first." };
  if (profileId === user.id) return { error: "That's you." };

  const listing = await getCoachByProfileId(user.id);
  const senderIsCoach = listing?.status === "approved" || isVetter(user);
  if (!senderIsCoach) return { error: "Only coaches can message members directly." };

  const admin = supabaseAdmin();
  const { data } = await admin.from("profiles").select("*").eq("id", profileId).maybeSingle();
  const member = data as Profile | null;
  if (!member || member.archived_at) return { error: "We couldn't reach them — try again later." };
  if (!member.allow_coach_contact) {
    return { error: "They've turned off messages from coaches." };
  }
  if (!member.email) return { error: "We couldn't reach them — try again later." };

  // One note per member per day, DAILY_LIMIT overall, off the send events
  // themselves — a coach working through the directory shouldn't be able to
  // turn it into a mailing list.
  // Tagged kind, so the recruiter messaging in app/actions/engage.ts — which
  // logs message_sent too — doesn't eat into a coach's allowance.
  const { data: recent } = await admin
    .from("analytics_events")
    .select("target_profile_id")
    .eq("user_id", user.id)
    .eq("event_type", "message_sent")
    .eq("metadata->>kind", "coach_outreach")
    .gte("created_at", new Date(Date.now() - DAY_MS).toISOString());
  const sentToday = (recent ?? []) as { target_profile_id: string | null }[];
  const firstName = (member.name ?? "they").split(" ")[0];
  if (sentToday.some((e) => e.target_profile_id === member.id)) {
    return { error: `You've already messaged ${firstName} today — give them a chance to reply.` };
  }
  if (sentToday.length >= DAILY_LIMIT) {
    return { error: `You've sent ${DAILY_LIMIT} messages today — try again tomorrow.` };
  }

  const coachName = listing?.full_name || user.name || "A coach";
  const credentials = [
    listing?.title || listing?.company,
    listing?.best_for && `Best for: ${listing.best_for}`,
  ].filter((f): f is string => !!f);

  const context = listing
    ? `
    <div style="margin-top:24px;border-top:1px solid #2e2e34;padding-top:20px">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8d8677">
        About ${escapeHtml(coachName)}
      </p>
      ${credentials
        .map((f) => `<p style="margin:0 0 6px;font-size:14px;color:#c9c2b2">${escapeHtml(f)}</p>`)
        .join("")}
      <p style="margin:14px 0 0;font-size:13px">
        <a href="https://onwardupward.io/coaches/${listing.id}" style="color:#e8c987">See their coaching profile →</a>
      </p>
    </div>`
    : "";

  const sent = await sendEmail({
    to: member.email,
    replyTo: user.email ?? undefined,
    subject: `${coachName} reached out on onward/upward`,
    html: emailShell(
      `${firstName}, a coach reached out.`,
      `${toParagraphs(body)}${context}
       <p style="margin-top:18px;font-size:13px;color:#8d8677">Reply to this email and it goes
        straight back to them. To stop hearing from coaches, turn off "Allow coaches to
        contact me" in your onward/upward settings.</p>`,
    ),
  });
  if (!sent) return { error: "We couldn't send that just now — try again." };

  await admin.from("analytics_events").insert({
    user_id: user.id,
    target_profile_id: member.id,
    event_type: "message_sent",
    metadata: { kind: "coach_outreach", coach: coachName },
  });

  return {};
}
