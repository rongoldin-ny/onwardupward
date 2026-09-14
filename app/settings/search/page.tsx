import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import SettingsShell from "../SettingsShell";
import RecruiterPrefsForm from "./RecruiterPrefsForm";

/** Recruiter search preferences — dormant while recruiting is off, kept intact. */
export default async function SearchSettingsPage() {
  const user = await requireUser();
  if (user.role !== "recruiter") redirect("/profile");

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
