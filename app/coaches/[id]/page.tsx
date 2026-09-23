import { notFound, redirect } from "next/navigation";
import ProfilePage from "@/components/profile/ProfilePage";
import { currentUser } from "@/lib/auth";
import { coachListingVisible, type CoachRow } from "@/lib/coach-shared";
import { getCoachReviews, getOwnReview } from "@/lib/coach-reviews-db";
import { getCoachMatches } from "@/lib/coach-match";
import { getDirectoryCoaches } from "@/lib/coaches-db";
import type { Profile } from "@/lib/db";
import { coachOnlyProfileView, toProfileView } from "@/lib/profile-view";
import { accessFor } from "@/lib/viewer-access";
import { isVetter } from "@/lib/vetting";
import { sameEmail } from "@/lib/claims";
import { supabaseAdmin } from "@/lib/supabase/server";
import { trackingOptedOut } from "@/lib/tracking-consent";

/**
 * Coach detail — the owner's unified profile opened on the Coach face.
 * Curated seeds with no owner render coach-only. Publicly shareable, just
 * like profile share links.
 */
export default async function CoachDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  // Landing here straight from a claim that still needs a look — see
  // app/auth/callback/route.ts.
  const notice =
    (await searchParams).welcome === "claim"
      ? "You're in! We're confirming this listing is yours — we'll email you the moment it's yours to edit."
      : undefined;
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
  // Unclaimed listings are private to members and coaches until claimed.
  // Admins see them all; so does the coach the listing describes — signed out
  // off a share link (the way in to claiming it), signed in under the listing's
  // email, or waiting on a claim they've already made.
  if (
    coach.status === "unclaimed" &&
    user &&
    !isVetter(user) &&
    !hasPendingClaim &&
    !sameEmail(user.email, coach.email)
  ) {
    notFound();
  }

  if (!(await trackingOptedOut())) await admin.from("analytics_events").insert({
    user_id: user?.id ?? null,
    event_type: "coach_view",
    metadata: { coach_id: coach.id, coach: coach.full_name, kind: "detail" },
  });

  const viewer = user ? "member" : "public";
  // Scored against the whole bench (same cached result as /coaches) so "match"
  // means the same thing everywhere. Not awaited — it streams into the card.
  const topMatch =
    user?.role === "candidate"
      ? getDirectoryCoaches()
          .then((bench) => getCoachMatches(user, bench))
          .then((matches) => matches[coach.id] ?? null)
          .catch(() => null)
      : null;

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
      if (!coachListingVisible(coach, profile)) notFound();
      const view = await toProfileView(profile, { admin: true, ...(await accessFor(user)) });
      return (
        <ProfilePage
          view={view}
          viewer={viewer}
          initialSide="coach"
          topMatch={topMatch}
          hasPendingClaim={hasPendingClaim}
          reviews={reviews}
          ownReview={ownReview}
          notice={notice}
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
      notice={notice}
    />
  );
}

/**
 * Coach pages stay out of search engines for now — many listings were built
 * from public info before the coach joined. Link unfurls (Open Graph) still work.
 */
const NO_INDEX = { index: false, follow: false };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { title: "onward/upward", robots: NO_INDEX };
  const { data } = await supabaseAdmin()
    .from("coaches")
    .select("full_name, short_description, best_for, company, photo_url")
    .eq("id", id)
    .maybeSingle();
  if (!data?.full_name) return { title: "onward/upward", robots: NO_INDEX };

  // These links get pasted into email and Slack, so give the unfurl something
  // to show rather than a bare URL.
  const title = `${data.full_name} — coach on onward/upward`;
  const description =
    data.short_description || data.best_for || data.company || "A coach on onward/upward.";
  return {
    title,
    description,
    robots: NO_INDEX,
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
