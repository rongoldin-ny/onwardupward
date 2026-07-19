import { redirect } from "next/navigation";
import { requireUser, homeFor } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { getReferences, getWorkHistory } from "@/lib/db";
import CandidateWizard from "./CandidateWizard";
import RecruiterWizard from "./RecruiterWizard";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.onboarding_complete) redirect(homeFor(user));

  if (user.role === "recruiter") {
    const supabase = await supabaseServer();
    const { data: rp } = await supabase
      .from("recruiter_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    return (
      <RecruiterWizard
        initialCompanies={(rp?.company_names as string[]) ?? []}
        initialRoleTypes={(rp?.target_role_types as string[]) ?? []}
        initialStages={(rp?.target_career_stages as string[]) ?? []}
      />
    );
  }

  const [work, references] = await Promise.all([
    getWorkHistory(user.id),
    getReferences(user.id),
  ]);
  return <CandidateWizard profile={user} work={work} references={references} />;
}
