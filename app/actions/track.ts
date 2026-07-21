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
  coachName: string,
  kind: "book" | "claim" | "website",
): Promise<void> {
  const user = await currentUser().catch(() => null);
  await supabaseAdmin()
    .from("analytics_events")
    .insert({
      user_id: user?.id ?? null,
      event_type: "coach_view",
      metadata: { coach: String(coachName).slice(0, 120), kind },
    });
}
