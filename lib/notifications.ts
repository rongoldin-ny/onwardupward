/**
 * The two broadcast notification types behind the settings toggles: the weekly
 * digest and product updates. Both read `profiles.notification_prefs` at send
 * time, so switching a toggle off genuinely stops mail going out.
 *
 * Every send goes through `sendOne` in sequence with a short gap — Resend
 * rate-limits, and a burst across the whole member list would get throttled.
 */

import { coachAnalytics } from "./coach-analytics";
import { coachDisciplineLabels, disciplineForRoleType } from "./coach-shared";
import { getDirectoryCoaches } from "./coaches-db";
import { emailShell, sendEmail } from "./email";
import { getReadsPageData } from "./mentorship-posts";
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

export type DigestResult = { candidates: number; skipped: number; sent: number; empty: number };

const NEW_COACH_WINDOW_MS = 14 * 24 * 3600_000;
const NEW_READ_WINDOW_MS = 7 * 24 * 3600_000;
const SECTION_LIMIT = 3;

function section(title: string, inner: string): string {
  return `<p style="margin:24px 0 8px;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8d8677">${title}</p>${inner}`;
}

function linkList(items: { url: string; primary: string; secondary: string }[]): string {
  return items
    .map(
      (i) =>
        `<p style="margin:0 0 10px"><a href="${i.url}" style="color:#efe9dd;font-weight:700;text-decoration:none">${escapeHtml(
          i.primary,
        )}</a><br /><span style="font-size:13px;color:#8d8677">${escapeHtml(i.secondary)}</span></p>`,
    )
    .join("");
}

/**
 * One digest per approved candidate: coaches who just joined and match their
 * discipline, reads published this week, and — for members who run a coach
 * listing — how that listing performed.
 *
 * Coaches and reads are fetched once and reused across every recipient, so the
 * job's cost doesn't scale with the member count. Matching is deterministic
 * discipline overlap rather than the AI matcher the directory uses: this runs
 * unattended under a 60s ceiling, where one model call per member wouldn't fit.
 *
 * A member with nothing in any section is skipped rather than mailed, since an
 * empty digest is worse than no digest.
 */
export async function sendWeeklyDigests(): Promise<DigestResult> {
  const supabase = supabaseAdmin();
  const now = Date.now();

  // Approved only: a pending member's listing isn't live yet.
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, name, email, role_type, notification_prefs, last_digest_sent_at")
    .eq("role", "candidate")
    .eq("vetting_status", "approved")
    .not("email", "is", null);

  const all = (profileRows ?? []) as (Recipient & {
    role_type: string | null;
    last_digest_sent_at: string | null;
  })[];
  const due = all.filter((p) => {
    if (!p.email || !optedIn(p, "weekly_digest")) return false;
    if (!p.last_digest_sent_at) return true;
    return now - new Date(p.last_digest_sent_at).getTime() > DIGEST_COOLDOWN_MS;
  });
  if (due.length === 0) {
    return { candidates: all.length, skipped: all.length, sent: 0, empty: 0 };
  }

  const [directory, reads, listingRows] = await Promise.all([
    getDirectoryCoaches().catch(() => []),
    getReadsPageData().catch(() => ({ coachPosts: [], otherPosts: [] })),
    supabase
      .from("coaches")
      .select("id, profile_id")
      .in("profile_id", due.map((p) => p.id))
      .in("status", ["approved", "unclaimed"]),
  ]);

  const newCoaches = directory.filter(
    (c) => now - new Date(c.created_at).getTime() < NEW_COACH_WINDOW_MS,
  );
  const freshReads = [...reads.coachPosts, ...reads.otherPosts].filter(
    (r) => r.publishedAtMs > 0 && now - r.publishedAtMs < NEW_READ_WINDOW_MS,
  );
  const listingByProfile = new Map(
    ((listingRows.data ?? []) as { id: string; profile_id: string | null }[])
      .filter((l) => l.profile_id)
      .map((l) => [l.profile_id as string, l.id]),
  );

  const queue: { id: string; email: string; subject: string; html: string }[] = [];
  let empty = 0;

  for (const p of due) {
    const discipline = disciplineForRoleType(p.role_type);
    const blocks: string[] = [];

    const coachPicks = (
      discipline
        ? newCoaches.filter((c) => coachDisciplineLabels(c).includes(discipline))
        : newCoaches
    ).slice(0, SECTION_LIMIT);
    if (coachPicks.length > 0) {
      blocks.push(
        section(
          "New coaches for you",
          linkList(
            coachPicks.map((c) => ({
              url: `https://onwardupward.io/coaches/${c.id}`,
              primary: c.full_name,
              secondary: c.best_for || c.short_description || c.company || "",
            })),
          ),
        ),
      );
    }

    // Prefer reads from this member's discipline; fall back to everything fresh
    // so the section isn't empty just because no coach in their lane published.
    const matched = discipline
      ? freshReads.filter((r) => r.disciplines.includes(discipline))
      : [];
    const readPicks = (matched.length > 0 ? matched : freshReads).slice(0, SECTION_LIMIT);
    if (readPicks.length > 0) {
      blocks.push(
        section(
          "New reads",
          linkList(
            readPicks.map((r) => ({
              url: r.url,
              primary: r.title,
              secondary: [r.author ?? r.publication, r.publishedLabel].filter(Boolean).join(" · "),
            })),
          ),
        ),
      );
    }

    const listingId = listingByProfile.get(p.id);
    if (listingId) {
      const a = await coachAnalytics(listingId);
      blocks.push(
        section(
          "Your coaching, last 30 days",
          `<p style="margin:0">${a.impressions30d} impressions · ${a.views30d} views ·
           <strong style="color:#efe9dd">${a.requests30d} ${
             a.requests30d === 1 ? "request" : "requests"
           }</strong></p>`,
        ),
      );
    }

    if (blocks.length === 0) {
      empty += 1;
      continue;
    }

    const firstName = (p.name ?? "there").split(" ")[0];
    queue.push({
      id: p.id,
      email: p.email as string,
      subject: "Your week on onward/upward",
      html: emailShell(`${firstName}, here's your week.`, `${blocks.join("")}${SETTINGS_NOTE}`, {
        label: "Open your dashboard",
        url: "https://onwardupward.io/dashboard",
      }),
    });
  }

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

  return { candidates: all.length, skipped: all.length - due.length, sent, empty };
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
