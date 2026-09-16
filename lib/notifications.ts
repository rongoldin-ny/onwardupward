/**
 * The two broadcast notification types behind the settings toggles: the weekly
 * digest and product updates. Both read `profiles.notification_prefs` at send
 * time, so switching a toggle off genuinely stops mail going out.
 *
 * Every send goes through `sendOne` in sequence with a short gap — Resend
 * rate-limits, and a burst across the whole member list would get throttled.
 */

import { emailShell, sendEmail } from "./email";
import { supabaseAdmin } from "./supabase/server";

type PrefKey = "weekly_digest" | "product_updates";

type Recipient = {
  id: string;
  name: string | null;
  email: string | null;
  notification_prefs: Partial<Record<PrefKey, boolean>> | null;
};

const SEND_GAP_MS = 120;

const SETTINGS_NOTE = `<p style="margin-top:12px;font-size:13px;color:#8d8677">
  You can turn these off any time in Settings → Notifications.</p>`;

/** A missing pref means opted in — the toggles default to on. */
function optedIn(r: Recipient, key: PrefKey): boolean {
  return (r.notification_prefs ?? {})[key] !== false;
}

async function sendSequentially(
  recipients: { email: string; subject: string; html: string; id: string }[],
  onSent?: (id: string) => Promise<void>,
): Promise<number> {
  let sent = 0;
  for (const r of recipients) {
    const ok = await sendEmail({ to: r.email, subject: r.subject, html: r.html });
    if (ok) {
      sent += 1;
      await onSent?.(r.id);
    }
    await new Promise((resolve) => setTimeout(resolve, SEND_GAP_MS));
  }
  return sent;
}

// ------------------------------------------------------------ weekly digest

/** Don't send twice inside a week, however often the cron fires. */
const DIGEST_COOLDOWN_MS = 6 * 24 * 3600_000;

export type DigestResult = { candidates: number; skipped: number; sent: number };

/**
 * One digest per candidate: their profile views this week and how that ranks.
 * View counts are read in a single query and grouped in memory rather than per
 * member, so the job costs one round trip no matter how many members there are.
 */
export async function sendWeeklyDigests(): Promise<DigestResult> {
  const supabase = supabaseAdmin();
  const now = Date.now();
  const weekMs = 7 * 24 * 3600_000;

  // Approved only: a pending member's profile isn't live, so a digest could
  // only ever tell them they got no views.
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, name, email, notification_prefs, last_digest_sent_at")
    .eq("role", "candidate")
    .eq("vetting_status", "approved")
    .not("email", "is", null);

  const all = (profileRows ?? []) as (Recipient & { last_digest_sent_at: string | null })[];
  const due = all.filter((p) => {
    if (!p.email || !optedIn(p, "weekly_digest")) return false;
    if (!p.last_digest_sent_at) return true;
    return now - new Date(p.last_digest_sent_at).getTime() > DIGEST_COOLDOWN_MS;
  });
  if (due.length === 0) return { candidates: all.length, skipped: all.length, sent: 0 };

  const { data: events } = await supabase
    .from("analytics_events")
    .select("target_profile_id, created_at")
    .eq("event_type", "profile_view")
    .gte("created_at", new Date(now - weekMs).toISOString());

  const weekly = new Map<string, number>();
  for (const e of (events ?? []) as { target_profile_id: string | null }[]) {
    if (e.target_profile_id) {
      weekly.set(e.target_profile_id, (weekly.get(e.target_profile_id) ?? 0) + 1);
    }
  }
  const counts = [...weekly.values()];

  const queue = due.map((p) => {
    const views = weekly.get(p.id) ?? 0;
    const below = counts.filter((c) => c < views).length;
    const topPct =
      counts.length === 0 ? 100 : Math.max(1, Math.round(100 - (below * 100) / counts.length));
    const firstName = (p.name ?? "there").split(" ")[0];
    const body =
      views > 0
        ? `<p>Your profile picked up <strong style="color:#efe9dd">${views} ${
            views === 1 ? "view" : "views"
          }</strong> this week — that puts you in the top ${topPct}% of profiles.</p>`
        : `<p>No views this week. Filling out a little more of your profile is the
           fastest way to start showing up.</p>`;
    return {
      id: p.id,
      email: p.email as string,
      subject: "Your week on onward/upward",
      html: emailShell(`${firstName}, here's your week.`, `${body}${SETTINGS_NOTE}`, {
        label: "Open your dashboard",
        url: "https://onwardupward.io/dashboard",
      }),
    };
  });

  // If the stamp can't be written (migration 0023 not applied), stop rather
  // than keep going: without it the cooldown never engages and the next fire
  // would mail everyone all over again.
  const sent = await sendSequentially(queue, async (id) => {
    const { error } = await supabase
      .from("profiles")
      .update({ last_digest_sent_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      throw new Error(
        `Digest sent to ${id} but last_digest_sent_at could not be written (${error.message}). ` +
          "Aborting so the cooldown can't silently fail — check migration 0023.",
      );
    }
  });

  return { candidates: all.length, skipped: all.length - due.length, sent };
}

// ----------------------------------------------------------- product updates

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Admin-authored plain text → paragraphs, escaped so stray markup can't break the email. */
function bodyToHtml(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para.trim()).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export async function productUpdateAudience(): Promise<number> {
  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("id, name, email, notification_prefs")
    .not("email", "is", null);
  return ((data ?? []) as Recipient[]).filter((r) => r.email && optedIn(r, "product_updates"))
    .length;
}

/** Broadcast an announcement to everyone who hasn't muted product updates. */
export async function sendProductUpdate(
  subject: string,
  body: string,
): Promise<{ recipients: number; sent: number }> {
  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("id, name, email, notification_prefs")
    .not("email", "is", null);

  const recipients = ((data ?? []) as Recipient[]).filter(
    (r) => r.email && optedIn(r, "product_updates"),
  );

  const html = emailShell(subject, `${bodyToHtml(body)}${SETTINGS_NOTE}`, {
    label: "Open onward/upward",
    url: "https://onwardupward.io/dashboard",
  });

  const sent = await sendSequentially(
    recipients.map((r) => ({ id: r.id, email: r.email as string, subject, html })),
  );
  return { recipients: recipients.length, sent };
}
