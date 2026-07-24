import { supabaseAdmin } from "./supabase/server";

export type CoachAnalytics = {
  impressions30d: number;
  impressionsAllTime: number;
  views30d: number;
  viewsAllTime: number;
  requests30d: number;
  requestsAllTime: number;
};

/**
 * Impressions/views/requests for one coach listing, computed from
 * `analytics_events` — mirrors `candidateStats()` in lib/stats.ts.
 * "Views" = coach_view events with kind "detail"; "Requests" = kind "book".
 */
export async function coachAnalytics(coachId: string): Promise<CoachAnalytics> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("analytics_events")
    .select("metadata, created_at")
    .eq("event_type", "coach_view")
    .eq("metadata->>coach_id", coachId);

  const events = data ?? [];
  const cutoff = Date.now() - 30 * 24 * 3600_000;

  const bucket = (kind: string) => {
    const rows = events.filter((e) => (e.metadata as { kind?: string } | null)?.kind === kind);
    return {
      allTime: rows.length,
      last30d: rows.filter((e) => new Date(e.created_at).getTime() >= cutoff).length,
    };
  };

  const impressions = bucket("impression");
  const views = bucket("detail");
  const requests = bucket("book");

  return {
    impressionsAllTime: impressions.allTime,
    impressions30d: impressions.last30d,
    viewsAllTime: views.allTime,
    views30d: views.last30d,
    requestsAllTime: requests.allTime,
    requests30d: requests.last30d,
  };
}
