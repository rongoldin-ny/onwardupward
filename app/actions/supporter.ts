"use server";

import { redirect } from "next/navigation";
import { requireCandidate } from "@/lib/auth";
import { trackEvent } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Supporter tier ($4.99/mo) — mock checkout for now, mirroring the recruiter
 * subscribe flow. When Stripe lands, these become checkout/portal redirects;
 * is_supporter is trigger-guarded so only service-role writes can flip it.
 */
export async function becomeSupporter(): Promise<void> {
  const user = await requireCandidate();
  await supabaseAdmin().from("profiles").update({ is_supporter: true }).eq("id", user.id);
  await trackEvent(user.id, "element_click", null, { element: "supporter_subscribe" });
  redirect("/settings/billing");
}

export async function cancelSupporter(): Promise<void> {
  const user = await requireCandidate();
  await supabaseAdmin().from("profiles").update({ is_supporter: false }).eq("id", user.id);
  await trackEvent(user.id, "element_click", null, { element: "supporter_cancel" });
  redirect("/settings/billing");
}
