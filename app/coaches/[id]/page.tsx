import { notFound, redirect } from "next/navigation";
import ProfilePage from "@/components/profile/ProfilePage";
import { currentUser } from "@/lib/auth";
import type { CoachRow } from "@/lib/coach-shared";
import { getCoachReviews, getOwnReview } from "@/lib/coach-reviews-db";
import { getCoachMatches } from "@/lib/coach-match";
import type { Profile } from "@/lib/db";
import { isPublishable } from "@/lib/profile-required";
import { coachOnlyProfileView, toProfileView } from "@/lib/profile-view";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Coach detail — the owner's unified profile opened on the Coach face.
 * Curated seeds with no owner render coach-only. Publicly shareable, just
 * like profile share links.
 */
export default async function CoachDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const admin = supabaseAdmin();
  const [{ data }, user] = await Promise.all([
    admin.from("coaches").select("*").eq("id", id).maybeSingle(),
    currentUser().catch(() => null),
  ]);
  if (!data) notFound();
  const coach = data as CoachRow;
  // Drafts and pending listings are only visible to their owner.
  if ((coach.status === "pending" || coach.status === "draft") && user?.id !== coach.profile_id) {
    notFound();
  }
  if (coach.profile_id && user?.id === coach.profile_id) redirect("/profile?side=coach");

  await admin.from("analytics_events").insert({
    user_id: user?.id ?? null,
    event_type: "coach_view",
    metadata: { coach_id: coach.id, coach: coach.full_name, kind: "detail" },
  });

  const viewer = user ? "member" : "public";
  const topMatch =
    user?.role === "candidate" ? ((await getCoachMatches(user, [coach]))[coach.id] ?? null) : null;

  let hasPendingClaim = false;
  if (user && coach.status === "unclaimed") {
    const { data: claim } = await admin
      .from("coach_claims")
      .select("id")
      .eq("coach_id", coach.id)
      .eq("profile_id", user.id)
      .eq("status", "pending")
      .maybeSingle();
    hasPendingClaim = !!claim;
  }

  const [reviews, ownReview] = await Promise.all([
    getCoachReviews(coach.id),
    user ? getOwnReview(coach.id, user.id) : Promise.resolve(null),
  ]);

  if (coach.profile_id) {
    const { data: p } = await admin
      .from("profiles")
      .select("*")
      .eq("id", coach.profile_id)
      .maybeSingle();
    if (p) {
      const profile = p as Profile;
      if (!isPublishable(profile)) notFound();
      const view = await toProfileView(profile, {
        admin: true,
        canSeePublicResume: user?.role === "coach" || user?.role === "recruiter",
      });
      return (
        <ProfilePage
          view={view}
          viewer={viewer}
          initialSide="coach"
          topMatch={topMatch}
          hasPendingClaim={hasPendingClaim}
          reviews={reviews}
          ownReview={ownReview}
        />
      );
    }
  }

  return (
    <ProfilePage
      view={coachOnlyProfileView(coach)}
      viewer={viewer}
      initialSide="coach"
      topMatch={topMatch}
      hasPendingClaim={hasPendingClaim}
      reviews={reviews}
      ownReview={ownReview}
    />
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { title: "onward/upward" };
  const { data } = await supabaseAdmin()
    .from("coaches")
    .select("full_name, short_description, best_for, company, photo_url")
    .eq("id", id)
    .maybeSingle();
  if (!data?.full_name) return { title: "onward/upward" };

  // These links get pasted into email and Slack, so give the unfurl something
  // to show rather than a bare URL.
  const title = `${data.full_name} — coach on onward/upward`;
  const description =
    data.short_description || data.best_for || data.company || "A coach on onward/upward.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: data.photo_url ? [{ url: data.photo_url }] : undefined,
    },
    twitter: {
      card: data.photo_url ? "summary_large_image" : "summary",
      title,
      description,
      images: data.photo_url ? [data.photo_url] : undefined,
    },
  };
}
