import { redirect } from "next/navigation";
import ProfilePage from "@/components/profile/ProfilePage";
import { requireUser } from "@/lib/auth";
import { getCoachReviews } from "@/lib/coach-reviews-db";
import { toProfileView } from "@/lib/profile-view";
import { getCommunitySkills } from "@/lib/superpowers-server";

// Enrichment runs post-response via after(); give the function time to finish it.
export const maxDuration = 60;

/** The signed-in user's own profile — the same layout visitors see, editable in place. */
export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ side?: string; welcome?: string }>;
}) {
  const user = await requireUser();
  if (user.role === "recruiter") redirect("/settings/search");
  const { side, welcome } = await searchParams;
  const [view, communitySkills] = await Promise.all([
    toProfileView(user, { isOwner: true }),
    getCommunitySkills(),
  ]);
  const reviews = view.coach ? await getCoachReviews(view.coach.id) : [];
  return (
    <ProfilePage
      view={view}
      viewer="owner"
      initialSide={side === "coach" ? "coach" : "player"}
      communitySkills={communitySkills}
      reviews={reviews}
      notice={
        // A member who already had an account claiming their listing — the
        // coach home is only for coach accounts, so the toast lands here.
        welcome === "coach"
          ? "You're in! Check your coaching profile and refine it as you like."
          : undefined
      }
    />
  );
}
