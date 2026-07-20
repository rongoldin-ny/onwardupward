"use server";

import { requireUser } from "@/lib/auth";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import { aiFillFromSources, type AiFillResult } from "@/lib/ai-fill";
import { triggerEnrichment } from "@/lib/enrich";
import { normalizeUrl } from "@/lib/extract";
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

/** Unlimited AI fills for the house account; everyone else gets exactly one. */
const AI_FILL_UNLIMITED = new Set(["r@rongoldin.com"]);

/**
 * "Fill with AI" on the settings profile editor. Reads the candidate's
 * portfolio (unlocking with their password when set) and LinkedIn, asks
 * Claude to propose values for every profile field, and returns the proposal
 * for review — nothing persists until the user hits Save. Usage is logged as
 * an analytics event via the admin client, which is also how the once-per-user
 * cap is enforced (events can't be deleted by users, so the cap sticks).
 */
export async function fillProfileWithAI(formData: FormData): Promise<{
  fill?: AiFillResult;
  error?: string;
}> {
  const user = await requireUser();
  if (user.role !== "candidate") return { error: "AI fill is for candidate profiles." };

  const admin = supabaseAdmin();
  if (!AI_FILL_UNLIMITED.has((user.email ?? "").toLowerCase())) {
    const { count } = await admin
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("event_type", "element_click")
      .contains("metadata", { element: "ai_fill" });
    if ((count ?? 0) >= 1) {
      return { error: "You've already used your one AI fill — edits are manual from here." };
    }
  }

  const linkedinRaw = String(formData.get("linkedin_url") ?? "").trim();
  const portfolioRaw = String(formData.get("portfolio_url") ?? "").trim();
  const password = String(formData.get("portfolio_password") ?? "").trim() || null;
  const linkedin = linkedinRaw ? normalizeUrl(linkedinRaw) : null;
  const portfolio = portfolioRaw ? normalizeUrl(portfolioRaw) : null;
  if (!portfolio && !linkedin) {
    return { error: "Add your portfolio URL (or LinkedIn) above first, then try again." };
  }

  try {
    const result = await aiFillFromSources({
      linkedinUrl: linkedin,
      portfolioUrl: portfolio,
      portfolioPassword: password ?? user.portfolio_password,
    });
    if (result.fill) {
      // Count the use only on success — a bad URL or gated site shouldn't
      // burn a user's single attempt. Logged via admin so it can't be undone.
      await admin.from("analytics_events").insert({
        user_id: user.id,
        event_type: "element_click",
        metadata: { element: "ai_fill" },
      });
    }
    return result;
  } catch (e) {
    console.error("AI fill failed:", e);
    return { error: "AI fill hit a snag — please try again in a minute." };
  }
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
