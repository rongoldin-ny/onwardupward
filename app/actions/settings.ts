"use server";

import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { triggerEnrichment } from "@/lib/enrich";
import {
  saveBasics,
  saveReferences,
  saveStory,
  saveWork,
} from "./onboarding";

/**
 * Single-screen profile editor: the form carries every field the wizard
 * collects, so we reuse the wizard's own save actions against one FormData,
 * then re-trigger AI enrichment per PRD §7.9.
 */
export async function saveFullProfile(formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();

  const basics = await saveBasics(formData);
  if (basics.error) return basics;
  await saveStory(formData);
  await saveWork(formData);
  await saveReferences(formData);

  const pref = String(formData.get("contact_preference") ?? "") === "linkedin" ? "linkedin" : "email";
  const supabase = await supabaseServer();
  await supabase.from("profiles").update({ contact_preference: pref }).eq("id", user.id);

  triggerEnrichment(user.id);
  return {};
}

/** Recruiter settings variant of the onboarding step — saves without redirecting. */
export async function saveRecruiterPrefs(formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();
  const companies = formData
    .getAll("companies")
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean);
  const roleTypes = formData.getAll("role_types").map(String);
  const stages = formData.getAll("career_stages").map(String);
  if (companies.length === 0 || roleTypes.length === 0 || stages.length === 0) {
    return { error: "Company, roles, and career stages are all required." };
  }
  const supabase = await supabaseServer();
  await supabase.from("recruiter_profiles").upsert({
    id: user.id,
    company_names: companies,
    target_role_types: roleTypes,
    target_career_stages: stages,
  });
  return {};
}
