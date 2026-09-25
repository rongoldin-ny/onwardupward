"use server";

import { redirect } from "next/navigation";
import { requireVetter } from "@/lib/vetting";
import { supabaseAdmin } from "@/lib/supabase/server";
import { emailShell, sendEmail } from "@/lib/email";

/**
 * Let a waitlisted coach in who never submitted a coaching card, so there's
 * no card to approve. (Members and submitted coaches are let in by approving
 * them in their own queues.)
 */
export async function letInFromWaitlist(profileId: string): Promise<void> {
  await requireVetter();
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("profiles")
    .select("id, name, email, waitlisted_at")
    .eq("id", profileId)
    .maybeSingle();
  if (!data?.waitlisted_at) redirect("/admin/waitlist");

  await admin.from("profiles").update({ waitlisted_at: null }).eq("id", profileId);
  if (data.email) {
    const firstName = (data.name ?? "there").split(" ")[0];
    await sendEmail({
      to: data.email,
      subject: "You're in — welcome to onward/upward",
      html: emailShell(
        `${firstName}, you're in.`,
        `<p>Thanks for waiting. Your onward/upward account is open — finish your
         coaching card from your profile whenever you're ready, and submit it for
         review to go live on the bench.</p>`,
        { label: "Sign in to onward/upward", url: "https://onwardupward.io/signin" },
      ),
    });
  }
  redirect("/admin/waitlist");
}
