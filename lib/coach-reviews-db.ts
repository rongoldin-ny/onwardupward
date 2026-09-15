import { supabaseAdmin } from "./supabase/server";

export type CoachReview = {
  id: string;
  coachId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerPhoto: string | null;
  helpedWith: string;
  outcome: string;
  comments: string | null;
  createdAt: string;
};

type ReviewRow = {
  id: string;
  coach_id: string;
  reviewer_id: string;
  helped_with: string;
  outcome: string;
  comments: string | null;
  created_at: string;
  reviewer: { id: string; name: string | null; photo_url: string | null } | null;
};

function toReview(r: ReviewRow): CoachReview {
  return {
    id: r.id,
    coachId: r.coach_id,
    reviewerId: r.reviewer_id,
    reviewerName: r.reviewer?.name ?? "A member",
    reviewerPhoto: r.reviewer?.photo_url ?? null,
    helpedWith: r.helped_with,
    outcome: r.outcome,
    comments: r.comments,
    createdAt: r.created_at,
  };
}

/** Reviews for one coach, newest first. */
export async function getCoachReviews(coachId: string): Promise<CoachReview[]> {
  const { data } = await supabaseAdmin()
    .from("coach_reviews")
    .select("id, coach_id, reviewer_id, helped_with, outcome, comments, created_at, reviewer:profiles(id, name, photo_url)")
    .eq("coach_id", coachId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as ReviewRow[]).map(toReview);
}

/** Review counts for every coach in one query, for the directory's "n reviews" badge. */
export async function getReviewCounts(coachIds: string[]): Promise<Record<string, number>> {
  if (coachIds.length === 0) return {};
  const { data } = await supabaseAdmin()
    .from("coach_reviews")
    .select("coach_id")
    .in("coach_id", coachIds);
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { coach_id: string }[]) {
    counts[row.coach_id] = (counts[row.coach_id] ?? 0) + 1;
  }
  return counts;
}

/** The signed-in viewer's own review of this coach, if they've written one. */
export async function getOwnReview(coachId: string, reviewerId: string): Promise<CoachReview | null> {
  const { data } = await supabaseAdmin()
    .from("coach_reviews")
    .select("id, coach_id, reviewer_id, helped_with, outcome, comments, created_at, reviewer:profiles(id, name, photo_url)")
    .eq("coach_id", coachId)
    .eq("reviewer_id", reviewerId)
    .maybeSingle();
  return data ? toReview(data as unknown as ReviewRow) : null;
}
