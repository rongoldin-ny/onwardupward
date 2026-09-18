import { aiFillFromSources } from "./ai-fill";
import { getProfileById, type PortfolioImage } from "./db";
import { runEnrichment } from "./enrich";
import { resumeTextFromUrl } from "./resume";
import { supabaseAdmin } from "./supabase/server";
import { saveImageFromUrl } from "./uploads";

/** Analytics marker for the automatic run — distinct from the member's own one-time "ai_fill". */
const AUTO_FILL_ELEMENT = "ai_fill_auto";

/**
 * Run Claude's profile fill once, automatically, when a member finishes
 * sign-up with a portfolio or résumé on file — the same pipeline as the
 * "Fill with AI" button, but written straight to the profile.
 *
 * Only ever fills what's empty: anything the member typed (or the sign-up
 * importer already found) is left alone. Doesn't use up the member's own
 * manual AI fill. Safe to call twice — a logged run is never repeated.
 */
export async function autoFillProfile(profileId: string): Promise<string[]> {
  const profile = await getProfileById(profileId);
  if (!profile || profile.role !== "candidate") return [];
  if (!profile.portfolio_url && !profile.resume_url) return [];

  const admin = supabaseAdmin();
  const { count } = await admin
    .from("analytics_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profileId)
    .eq("event_type", "element_click")
    .contains("metadata", { element: AUTO_FILL_ELEMENT });
  if ((count ?? 0) > 0) return [];

  const { fill, error } = await aiFillFromSources({
    linkedinUrl: profile.linkedin_url,
    portfolioUrl: profile.portfolio_url,
    portfolioPassword: profile.portfolio_password,
    resumeText: profile.resume_url ? await resumeTextFromUrl(profile.resume_url) : null,
  });
  if (!fill) {
    console.error(`auto fill skipped for ${profileId}:`, error);
    return [];
  }

  const filled: string[] = [];
  const patch: Record<string, unknown> = {};
  const fillIfEmpty = (column: string, current: unknown, value: unknown) => {
    const empty = current === null || current === undefined || current === "" ||
      (Array.isArray(current) && current.length === 0);
    const hasValue = value !== null && value !== undefined && value !== "" &&
      !(Array.isArray(value) && value.length === 0);
    if (empty && hasValue) {
      patch[column] = value;
      filled.push(column);
    }
  };
  fillIfEmpty("name", profile.name, fill.name);
  fillIfEmpty("role_type", profile.role_type, fill.role_type);
  fillIfEmpty("career_stage", profile.career_stage, fill.career_stage);
  fillIfEmpty("location_country", profile.location_country, fill.location_country);
  fillIfEmpty("location_state", profile.location_state, fill.location_state);
  fillIfEmpty("location_city", profile.location_city, fill.location_city);
  fillIfEmpty("bio", profile.bio, fill.bio);
  fillIfEmpty("last_role_text", profile.last_role_text, fill.last_role_text);
  fillIfEmpty("brags", profile.brags, fill.brags.slice(0, 5));
  fillIfEmpty("industries", profile.industries, fill.industries);

  // Images live on the candidate's own site — mirror them into our storage.
  if (profile.portfolio_images.length === 0 && fill.images.length > 0) {
    const images: PortfolioImage[] = [];
    for (const img of fill.images) {
      const url = await saveImageFromUrl(img.url, profileId);
      if (!url) continue;
      images.push({
        url,
        company: img.company.slice(0, 80),
        caption: img.caption.slice(0, 200),
        year: (img.year ?? "").replace(/\D/g, "").slice(0, 4),
      });
    }
    if (images.length > 0) {
      patch.portfolio_images = images;
      filled.push("portfolio_images");
    }
  }
  if (!profile.photo_url && fill.photo_url) {
    const url = await saveImageFromUrl(fill.photo_url, profileId);
    if (url) {
      patch.photo_url = url;
      filled.push("photo_url");
    }
  }

  if (Object.keys(patch).length > 0) {
    await admin.from("profiles").update(patch).eq("id", profileId);
  }

  const [{ count: workCount }, { count: refCount }] = await Promise.all([
    admin.from("work_history").select("id", { count: "exact", head: true }).eq("candidate_id", profileId),
    admin.from("refs").select("id", { count: "exact", head: true }).eq("candidate_id", profileId),
  ]);
  if (!workCount && fill.work.length > 0) {
    await admin.from("work_history").insert(
      fill.work.map((w, i) => ({ candidate_id: profileId, title: w.title, company: w.company, sort_order: i })),
    );
    filled.push("work_history");
  }
  if (!refCount && fill.references.length > 0) {
    await admin.from("refs").insert(
      fill.references.map((r, i) => ({
        candidate_id: profileId,
        full_name: r.full_name,
        current_title: r.current_title,
        linkedin_url: r.linkedin_url,
        sort_order: i,
      })),
    );
    filled.push("references");
  }

  await admin.from("analytics_events").insert({
    user_id: profileId,
    event_type: "element_click",
    metadata: { element: AUTO_FILL_ELEMENT, filled },
  });
  return filled;
}

/**
 * After sign-up: fill the profile from their links, then regenerate the
 * AI bio from the fuller profile. Runs after the response (Next's after())
 * so finishing onboarding stays instant.
 */
export function triggerAutoFillThenEnrich(profileId: string) {
  import("next/server")
    .then(({ after }) => {
      after(async () => {
        try {
          await autoFillProfile(profileId);
        } catch (e) {
          console.error("auto fill failed:", e);
        }
        try {
          await runEnrichment(profileId);
        } catch (e) {
          console.error("enrichment failed:", e);
        }
      });
    })
    .catch((e) => console.error("could not schedule auto fill:", e));
}
