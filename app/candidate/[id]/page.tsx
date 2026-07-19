import { notFound } from "next/navigation";
import { requirePaidRecruiter } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { trackEvent, type Profile } from "@/lib/db";
import { toCandidateView } from "@/lib/candidate-view";
import CandidateProfileView from "@/components/CandidateProfileView";

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await requirePaidRecruiter();
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: candidate } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("role", "candidate")
    .maybeSingle();
  if (!candidate) notFound();

  await trackEvent(viewer.id, "profile_view", candidate.id, {
    target_profile_id: candidate.id,
  });

  return (
    <CandidateProfileView
      candidate={await toCandidateView(candidate as Profile)}
      mode="recruiter"
    />
  );
}
