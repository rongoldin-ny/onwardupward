import { supabaseAdmin } from "./supabase/server";
import type { Profile } from "./db";

export type CandidateStats = {
  viewsToday: number;
  viewsThisWeek: number;
  deltaPct: number | null; // vs last week; null when last week had no views
  topPct: number; // "You're in the top X%"
};

/**
 * Computed with the admin client: the percentile needs other candidates'
 * view counts, which RLS (correctly) hides from the candidate themselves.
 * Only aggregates leave this function.
 */
export async function candidateStats(candidateId: string): Promise<CandidateStats> {
  const supabase = supabaseAdmin();
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 3600_000).toISOString();

  const { data: events } = await supabase
    .from("analytics_events")
    .select("target_profile_id, created_at")
    .eq("event_type", "profile_view")
    .gte("created_at", twoWeeksAgo);

  const all = events ?? [];
  const now = Date.now();
  const weekMs = 7 * 24 * 3600_000;
  const todayStart = new Date().setHours(0, 0, 0, 0);

  const mine = all.filter((e) => e.target_profile_id === candidateId);
  const viewsToday = mine.filter((e) => new Date(e.created_at).getTime() >= todayStart).length;
  const viewsThisWeek = mine.filter((e) => now - new Date(e.created_at).getTime() < weekMs).length;
  const viewsLastWeek = mine.length - viewsThisWeek;
  const deltaPct =
    viewsLastWeek === 0
      ? null
      : Math.round(((viewsThisWeek - viewsLastWeek) / viewsLastWeek) * 100);

  // Percentile per PRD §11.3, across candidates with any views this week.
  const weekly = new Map<string, number>();
  for (const e of all) {
    if (now - new Date(e.created_at).getTime() < weekMs && e.target_profile_id) {
      weekly.set(e.target_profile_id, (weekly.get(e.target_profile_id) ?? 0) + 1);
    }
  }
  const counts = [...weekly.values()];
  const myWeekly = weekly.get(candidateId) ?? 0;
  const below = counts.filter((c) => c < myWeekly).length;
  const percentile = counts.length === 0 ? 0 : (below * 100) / counts.length;
  const topPct = Math.max(1, Math.round(100 - percentile));

  return { viewsToday, viewsThisWeek, deltaPct, topPct };
}

/** PRD §7.8 — banner shows if any optional profile sections are still empty. */
export function profileIncomplete(profile: Profile): boolean {
  return (
    !profile.bio ||
    !profile.dream_job ||
    !profile.last_role_text ||
    profile.brags.length === 0 ||
    !profile.portfolio_url ||
    !profile.photo_url
  );
}
