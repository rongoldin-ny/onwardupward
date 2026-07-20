"use server";

import { redirect } from "next/navigation";
import { requireUser, homeFor } from "@/lib/auth";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import { getWorkHistory, type PortfolioImage, type Profile, type WorkHistoryRow } from "@/lib/db";
import { emailShell, sendEmail } from "@/lib/email";
import { triggerEnrichment } from "@/lib/enrich";
import { extractProfile, fetchPortfolioHtml, normalizeUrl } from "@/lib/extract";
import { saveImage, saveImageFromUrl } from "@/lib/uploads";

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v === "" ? null : v;
}

export type ImportResult = {
  error?: string;
  found: string[];
  profile?: Profile;
  work?: WorkHistoryRow[];
};

/**
 * Import-first onboarding: save the candidate's links, then try to pre-fill
 * the rest of the profile from their portfolio site. Only ever fills fields
 * the candidate hasn't set themselves — the wizard shows everything for review.
 */
export async function importFromLinks(formData: FormData): Promise<ImportResult> {
  const user = await requireUser();
  const supabase = await supabaseServer();
  const linkedinRaw = str(formData, "linkedin_url");
  const portfolioRaw = str(formData, "portfolio_url");

  if (!linkedinRaw) return { error: "Add your LinkedIn to continue.", found: [] };
  const linkedin = normalizeUrl(linkedinRaw);
  if (!linkedin || !/linkedin\.com/i.test(linkedin)) {
    return { error: "That doesn't look like a LinkedIn URL.", found: [] };
  }
  const portfolio = portfolioRaw ? normalizeUrl(portfolioRaw) : null;
  if (portfolioRaw && !portfolio) {
    return { error: "That portfolio URL doesn't look right.", found: [] };
  }
  const portfolioPassword = str(formData, "portfolio_password");

  await supabase
    .from("profiles")
    .update({
      linkedin_url: linkedin,
      portfolio_url: portfolio ?? user.portfolio_url,
      portfolio_password: portfolioPassword ?? user.portfolio_password,
    })
    .eq("id", user.id);

  const found: string[] = [];
  if (portfolio) {
    const html = await fetchPortfolioHtml(portfolio, portfolioPassword ?? user.portfolio_password);
    if (html) {
      const extracted = extractProfile(html);
      const patch: Record<string, unknown> = {};
      const set = (column: keyof Profile, value: unknown, current: unknown, label: string) => {
        if (value === undefined || value === null || current) return;
        patch[column] = value;
        found.push(label);
      };
      set("name", extracted.name, user.name, "name");
      set("bio", extracted.bio, user.bio, "bio");
      set("role_type", extracted.roleType, user.role_type, "role");
      set("career_stage", extracted.careerStage, user.career_stage, "career stage");
      set("location_city", extracted.city, user.location_city, "city");
      set("location_country", extracted.country, user.location_country, "country");
      if (extracted.yearsExperience && user.years_experience == null) {
        patch.years_experience = extracted.yearsExperience;
        found.push("years of experience");
      }
      if (extracted.industries.length > 0 && user.industries.length === 0) {
        patch.industries = extracted.industries;
        found.push("industries");
      }
      if (Object.keys(patch).length > 0) {
        await supabase.from("profiles").update(patch).eq("id", user.id);
      }

      if (extracted.work.length > 0 && (await getWorkHistory(user.id)).length === 0) {
        await supabase.from("work_history").insert(
          extracted.work.map((w, i) => ({
            candidate_id: user.id,
            title: w.title,
            company: w.company,
            sort_order: i,
          })),
        );
        found.push(`${extracted.work.length} ${extracted.work.length === 1 ? "role" : "roles"}`);
      }
    }
  }

  const { data: fresh } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return { found, profile: fresh as Profile, work: await getWorkHistory(user.id) };
}

export async function saveBasics(formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();
  const name = str(formData, "name");
  const roleType = str(formData, "role_type");
  const careerStage = str(formData, "career_stage");
  const linkedin = str(formData, "linkedin_url");
  const country = str(formData, "country");
  const city = str(formData, "city");
  if (!name || !roleType || !careerStage || !linkedin || !country || !city) {
    return { error: "Everything on this step is required." };
  }
  const yearsRaw = str(formData, "years_experience");
  const years = yearsRaw ? parseInt(yearsRaw, 10) : null;
  const industries = [
    ...new Set(
      formData
        .getAll("industries")
        .map((v) => String(v).trim().slice(0, 40))
        .filter(Boolean),
    ),
  ].slice(0, 15);

  const supabase = await supabaseServer();
  await supabase
    .from("profiles")
    .update({
      name,
      role_type: roleType,
      career_stage: careerStage,
      linkedin_url: linkedin,
      location_country: country,
      location_state: str(formData, "state"),
      location_city: city,
      years_experience:
        years !== null && !Number.isNaN(years) && years >= 0 && years <= 60 ? years : null,
      industries,
    })
    .eq("id", user.id);
  return {};
}

export async function saveStory(formData: FormData) {
  const user = await requireUser();
  const supabase = await supabaseServer();
  const brags = [1, 2, 3, 4, 5]
    .map((i) => str(formData, `brag_${i}`))
    .filter(Boolean) as string[];

  await supabase
    .from("profiles")
    .update({
      bio: str(formData, "bio"),
      last_role_text: str(formData, "last_role_text"),
      dream_job: str(formData, "dream_job"),
      brags,
    })
    .eq("id", user.id);

  await supabase.from("work_history").delete().eq("candidate_id", user.id);
  const rows = [];
  for (let i = 0; i < 3; i++) {
    const title = str(formData, `job_title_${i}`);
    const company = str(formData, `job_company_${i}`);
    if (title || company) rows.push({ candidate_id: user.id, title, company, sort_order: i });
  }
  if (rows.length > 0) await supabase.from("work_history").insert(rows);
}

export async function saveWork(formData: FormData) {
  const user = await requireUser();
  const supabase = await supabaseServer();
  const existingByUrl = new Map(user.portfolio_images.map((img) => [img.url, img]));

  // The client sends kept urls, AI-picked remote urls, and new files (in
  // display order), plus one metadata array covering kept-then-remote-then-new
  // in that same order.
  const kept = formData.getAll("existing_images").map(String);
  const remote = formData.getAll("remote_images").map(String);
  let meta: { company?: string; caption?: string; year?: string }[] = [];
  try {
    meta = JSON.parse(String(formData.get("images_meta") ?? "[]"));
  } catch {
    meta = [];
  }

  const images: PortfolioImage[] = [];
  for (const url of kept) {
    if (!existingByUrl.has(url)) continue; // only urls this candidate already owns
    images.push({ url, company: "", caption: "", year: "" });
  }
  for (const remoteUrl of remote) {
    if (images.length >= 10) break;
    // Mirror AI-picked portfolio images into our storage (SSRF-guarded) so
    // profiles never hotlink external sites. Failures drop their meta slot
    // too, keeping the metadata array aligned with what survived.
    const url = await saveImageFromUrl(remoteUrl, user.id);
    if (url) images.push({ url, company: "", caption: "", year: "" });
    else meta.splice(images.length, 1);
  }
  for (const entry of formData.getAll("images")) {
    if (images.length >= 10) break;
    if (entry instanceof File && entry.size > 0) {
      const url = await saveImage(entry, user.id);
      if (url) images.push({ url, company: "", caption: "", year: "" });
    }
  }
  images.forEach((img, i) => {
    const m = meta[i] ?? {};
    img.company = String(m.company ?? "").slice(0, 80);
    img.caption = String(m.caption ?? "").slice(0, 200);
    img.year = String(m.year ?? "").slice(0, 4).replace(/\D/g, "");
  });

  await supabase
    .from("profiles")
    .update({
      portfolio_url: str(formData, "portfolio_url"),
      portfolio_password: str(formData, "portfolio_password"),
      portfolio_images: images,
    })
    .eq("id", user.id);
}

export async function saveReferences(formData: FormData) {
  const user = await requireUser();
  const supabase = await supabaseServer();
  await supabase.from("refs").delete().eq("candidate_id", user.id);
  const rows = [];
  for (let i = 0; i < 3; i++) {
    const name = str(formData, `ref_name_${i}`);
    const title = str(formData, `ref_title_${i}`);
    const linkedin = str(formData, `ref_linkedin_${i}`);
    if (name || title || linkedin) {
      rows.push({
        candidate_id: user.id,
        full_name: name,
        current_title: title,
        linkedin_url: linkedin,
        sort_order: i,
      });
    }
  }
  if (rows.length > 0) await supabase.from("refs").insert(rows);
}

export async function savePhoto(formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "Add a photo to continue." };
  }
  const url = await saveImage(photo, user.id);
  if (!url) return { error: "That image didn't work — try a JPG or PNG under 10MB." };
  const supabase = await supabaseServer();
  await supabase.from("profiles").update({ photo_url: url }).eq("id", user.id);
  return {};
}

export async function saveContactPreference(formData: FormData) {
  const user = await requireUser();
  const pref = str(formData, "contact_preference") === "linkedin" ? "linkedin" : "email";
  const supabase = await supabaseServer();
  await supabase
    .from("profiles")
    .update({ contact_preference: pref, onboarding_complete: true })
    .eq("id", user.id);
  triggerEnrichment(user.id); // async — does not block navigation

  // First completion of a pending application → tell the vetting inbox.
  if (user.vetting_status === "pending" && !user.onboarding_complete) {
    await sendEmail({
      to: "r@rongoldin.com",
      subject: `New member application: ${user.name ?? user.email ?? "unnamed"}`,
      html: emailShell(
        "A new designer wants in.",
        `<p><strong style="color:#efe9dd">${user.name ?? "An unnamed candidate"}</strong> (${
          user.email ?? "no email"
        }) just finished their profile and is waiting for review.</p>`,
        {
          label: "Review their profile",
          url: `https://onwardupward.io/admin/vetting/${user.id}`,
        },
      ),
    });
  }
  redirect("/dashboard");
}

export async function saveRecruiterSearch(formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();
  const companies = formData
    .getAll("companies")
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean);
  const roleTypes = formData.getAll("role_types").map(String);
  const stages = formData.getAll("career_stages").map(String);
  if (companies.length === 0 || roleTypes.length === 0 || stages.length === 0) {
    return { error: "Everything on this step is required." };
  }
  const supabase = await supabaseServer();
  await supabase.from("recruiter_profiles").upsert({
    id: user.id,
    company_names: companies,
    target_role_types: roleTypes,
    target_career_stages: stages,
  });
  await supabase.from("profiles").update({ onboarding_complete: true }).eq("id", user.id);
  redirect("/subscribe");
}

export async function subscribe() {
  const user = await requireUser();
  if (user.role !== "recruiter") redirect(homeFor(user));
  // Mock Stripe per PRD §7.4 — just flip the flag. Must use the admin client:
  // a trigger blocks users from granting themselves is_paid.
  await supabaseAdmin().from("profiles").update({ is_paid: true }).eq("id", user.id);
  redirect("/search");
}
