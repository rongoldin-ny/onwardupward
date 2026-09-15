import { notFound, redirect } from "next/navigation";
import ProfilePage from "@/components/profile/ProfilePage";
import { currentUser } from "@/lib/auth";
import type { CoachRow } from "@/lib/coach-shared";
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

  if (coach.profile_id) {
    const { data: p } = await admin
      .from("profiles")
      .select("*")
      .eq("id", coach.profile_id)
      .maybeSingle();
    if (p) {
      const profile = p as Profile;
      if (!isPublishable(profile)) notFound();
      const view = await toProfileView(profile, { admin: true });
      return <ProfilePage view={view} viewer={viewer} initialSide="coach" topMatch={topMatch} />;
    }
  }

  return (
    <ProfilePage
      view={coachOnlyProfileView(coach)}
      viewer={viewer}
      initialSide="coach"
      topMatch={topMatch}
    />
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { title: "onward/upward" };
  const { data } = await supabaseAdmin()
    .from("coaches")
    .select("full_name")
    .eq("id", id)
    .maybeSingle();
  return {
    title: data?.full_name ? `${data.full_name} — coach on onward/upward` : "onward/upward",
  };
}
