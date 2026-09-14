import { notFound, redirect } from "next/navigation";
import ProfilePage from "@/components/profile/ProfilePage";
import { currentUser } from "@/lib/auth";
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

  const view = await toProfileView(profile, { admin: true });
  // Pending listings are only visible to their owner while under review.
  if (view.coach?.status === "pending") view.coach = null;
  const approved = profile.vetting_status === "approved" || view.coach?.status === "approved";
  if (!approved || !isPublishable(profile)) notFound();

  return <ProfilePage view={view} viewer={user ? "member" : "public"} initialSide="player" />;
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
