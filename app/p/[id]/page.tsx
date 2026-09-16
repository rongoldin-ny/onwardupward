import { notFound, redirect } from "next/navigation";
import ProfilePage from "@/components/profile/ProfilePage";
import { currentUser } from "@/lib/auth";
import { getCoachReviews, getOwnReview } from "@/lib/coach-reviews-db";
import type { Profile } from "@/lib/db";
import { isPublishable } from "@/lib/profile-required";
import { toProfileView } from "@/lib/profile-view";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Public share link for any profile — viewable without signing in. The
 * uuid itself is the capability: unguessable, shared by the owner. Visible
 * once the required fields are filled and either the member application or
 * the coach listing has been approved.
 */
export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [{ data }, user] = await Promise.all([
    supabaseAdmin().from("profiles").select("*").eq("id", id).maybeSingle(),
    currentUser().catch(() => null),
  ]);
  if (!data) notFound();
  const profile = data as Profile;
  if (user?.id === profile.id) redirect("/profile");

  const view = await toProfileView(profile, {
    admin: true,
    canSeePublicResume: user?.role === "coach" || user?.role === "recruiter",
  });
  // Drafts and pending listings are only visible to their owner.
  if (view.coach && view.coach.status !== "approved") view.coach = null;
  const approved = profile.vetting_status === "approved" || view.coach?.status === "approved";
  if (!approved || !isPublishable(profile, { isCoach: !!view.coach })) notFound();

  const [reviews, ownReview] = view.coach
    ? await Promise.all([
        getCoachReviews(view.coach.id),
        user ? getOwnReview(view.coach.id, user.id) : Promise.resolve(null),
      ])
    : [[], null];

  return (
    <ProfilePage
      view={view}
      viewer={user ? "member" : "public"}
      initialSide="player"
      reviews={reviews}
      ownReview={ownReview}
    />
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { title: "onward/upward" };
  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  return { title: data?.name ? `${data.name} — onward/upward` : "onward/upward" };
}
