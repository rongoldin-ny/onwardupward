"use server";

import { requireUser } from "@/lib/auth";
import { emailShell, sendEmail } from "@/lib/email";
import { supabaseServer } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/db";
import { trackingOptedOut } from "@/lib/tracking-consent";

export async function trackElementClick(
  targetProfileId: string,
  element: "linkedin" | "reference" | "portfolio" | "contact",
) {
  const user = await requireUser();
  if (await trackingOptedOut()) return;
  await trackEvent(user.id, "element_click", targetProfileId, {
    target_profile_id: targetProfileId,
    element,
  });
}
