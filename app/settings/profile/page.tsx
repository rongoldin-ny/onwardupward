import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { getReferences, getWorkHistory } from "@/lib/db";
import SettingsShell from "../SettingsShell";
import ProfileSettingsForm from "./ProfileSettingsForm";
import RecruiterPrefsForm from "./RecruiterPrefsForm";

export default async function ProfileSettingsPage() {
  const user = await requireUser();

  if (user.role === "recruiter") {
    const supabase = await supabaseServer();
    const { data: rp } = await supabase
      .from("recruiter_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    return (
      <SettingsShell title="Your search." subtitle="Who you are, and who you're looking for.">
        <RecruiterPrefsForm
          initialCompanies={(rp?.company_names as string[]) ?? []}
          initialRoleTypes={(rp?.target_role_types as string[]) ?? []}
          initialStages={(rp?.target_career_stages as string[]) ?? []}
        />
      </SettingsShell>
    );
  }

  const [work, references] = await Promise.all([
    getWorkHistory(user.id),
    getReferences(user.id),
  ]);
  return (
    <SettingsShell
      title="Edit profile."
      subtitle="Everything on one page — recruiters see it the moment you save."
    >
      <ProfileSettingsForm profile={user} work={work} references={references} />
    </SettingsShell>
  );
}
