import { supabaseAdmin } from "./supabase/server";
import type { Profile } from "./db";

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

export type CoachViewer = { profile: Profile; viewedAt: string };

/** Signed-in members who opened this coach's detail page, most recent first — one row per person. */
export async function getCoachViewers(coachId: string, limit = 20): Promise<CoachViewer[]> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("analytics_events")
    .select("user_id, created_at")
    .eq("event_type", "coach_view")
    .eq("metadata->>coach_id", coachId)
    .eq("metadata->>kind", "detail")
    .not("user_id", "is", null)
    .order("created_at", { ascending: false });

  const latestByUser = new Map<string, string>();
  for (const row of data ?? []) {
    const userId = row.user_id as string;
    if (!latestByUser.has(userId)) latestByUser.set(userId, row.created_at as string);
  }
  const userIds = Array.from(latestByUser.keys()).slice(0, limit);
  if (userIds.length === 0) return [];

  const { data: profiles } = await admin.from("profiles").select("*").in("id", userIds);
  const byId = new Map(((profiles ?? []) as Profile[]).map((p) => [p.id, p]));

  return userIds
    .map((id) => {
      const profile = byId.get(id);
      return profile ? { profile, viewedAt: latestByUser.get(id)! } : null;
    })
    .filter((v): v is CoachViewer => !!v);
}
