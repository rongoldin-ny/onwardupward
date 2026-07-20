import { notFound } from "next/navigation";
import { toCandidateView } from "@/lib/candidate-view";
import type { Profile } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase/server";
import CandidateProfileView from "@/components/CandidateProfileView";

/**
 * Public share link for a candidate profile — viewable without signing in.
 * The uuid itself is the capability: unguessable, shared by the candidate.
 */
export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("role", "candidate")
    .eq("vetting_status", "approved")
    .maybeSingle();
  if (!data || !data.onboarding_complete) notFound();

  const candidate = await toCandidateView(data as Profile, { admin: true });
  return <CandidateProfileView candidate={candidate} mode="public" />;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  return { title: data?.name ? `${data.name} — onward/upward` : "onward/upward" };
}
