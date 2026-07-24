"use server";

import { currentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Lightweight traffic + coach analytics, written via the admin client so
 * signed-out visitors count too. Fire-and-forget from the client.
 */

const IGNORED = /^\/(api|_next)\//;

export async function trackPageView(path: string): Promise<void> {
  const clean = String(path ?? "").slice(0, 200);
  if (!clean.startsWith("/") || IGNORED.test(clean)) return;
  const user = await currentUser().catch(() => null);
  await supabaseAdmin()
    .from("analytics_events")
    .insert({ user_id: user?.id ?? null, event_type: "page_view", metadata: { path: clean } });
}

export async function trackCoachView(
  coachId: string,
  coachName: string,
  kind: "book" | "claim" | "website",
): Promise<void> {
  const user = await currentUser().catch(() => null);
  await supabaseAdmin()
    .from("analytics_events")
    .insert({
      user_id: user?.id ?? null,
      event_type: "coach_view",
      metadata: { coach_id: coachId, coach: String(coachName).slice(0, 120), kind },
    });
}

/** Batched "seen in the directory" logging for a rendered/filtered result set. */
export async function trackCoachImpressions(coachIds: string[]): Promise<void> {
  const ids = [...new Set(coachIds)].slice(0, 200);
  if (ids.length === 0) return;
  const user = await currentUser().catch(() => null);
  await supabaseAdmin()
    .from("analytics_events")
    .insert(
      ids.map((id) => ({
        user_id: user?.id ?? null,
        event_type: "coach_view" as const,
        metadata: { coach_id: id, kind: "impression" },
      })),
    );
}
