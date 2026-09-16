"use server";

import { requireUser } from "@/lib/auth";
import type { CoachRow } from "@/lib/coach-shared";
import { getCoachByProfileId, syncCoachIdentity } from "@/lib/coaches-db";
import type { PortfolioImage, Profile } from "@/lib/db";
import { triggerEnrichment } from "@/lib/enrich";
import { normalizeUrl } from "@/lib/extract";
import { missingRequired, type RequiredLabel } from "@/lib/profile-required";
import { supabaseServer } from "@/lib/supabase/server";
import { saveImage } from "@/lib/uploads";
import { saveCoachAttributes } from "./coaches";
import { saveBasics, saveReferences, saveStory, saveWork } from "./onboarding";

export type SaveProfileResult = {
  error?: string;
  images?: PortfolioImage[];
  photoUrl?: string | null;
  missingRequired?: RequiredLabel[];
  coach?: CoachRow | null;
};

/**
 * The inline profile editor carries every field in one form, so we reuse
 * the wizard's own save actions (already tolerant of partial data) and
 * layer the identity-panel extras on top. Coaching attributes save when
 * the user already has a listing or just opted in via `coaching_enabled`.
 */
export async function saveProfilePage(formData: FormData): Promise<SaveProfileResult> {
  const user = await requireUser();

  const basics = await saveBasics(formData);
  if (basics.error) return basics;
  await saveStory(formData);
  await saveWork(formData);
  await saveReferences(formData);

  const websiteRaw = String(formData.get("website_url") ?? "").trim();
  const website = websiteRaw ? normalizeUrl(websiteRaw) : null;
  if (websiteRaw && !website) return { error: "That website URL doesn't look right." };

  const patch: Partial<Profile> = {
    website_url: website,
    open_to_coaching_outreach: formData.get("open_to_coaching_outreach") === "on",
    resume_public: formData.get("resume_public") === "on",
    contact_preference: "email",
  };
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const url = await saveImage(photo, user.id);
    if (!url) return { error: "That image didn't work — try a JPG or PNG under 10MB." };
    patch.photo_url = url;
  }

  const supabase = await supabaseServer();
  await supabase.from("profiles").update(patch).eq("id", user.id);

  let coach: CoachRow | null = await getCoachByProfileId(user.id);
  if (coach || formData.get("coaching_enabled") === "1") {
    const result = await saveCoachAttributes(formData);
    if (result.error) return result;
    coach = result.coach ?? coach;
  }
  await syncCoachIdentity(user.id);

  const { data: fresh } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = fresh as Profile;

  // Autosaves fire on every pause in typing — the client re-enriches once
  // editing settles instead.
  if (formData.get("autosave") !== "1") triggerEnrichment(user.id);
  return {
    images: profile.portfolio_images,
    photoUrl: profile.photo_url,
    missingRequired: missingRequired(profile, { isCoach: !!coach }),
    coach,
  };
}
