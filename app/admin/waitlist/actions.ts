"use server";

import { redirect } from "next/navigation";
import { requireVetter } from "@/lib/vetting";
import { supabaseAdmin } from "@/lib/supabase/server";
import { emailShell, escapeHtml, sendEmail } from "@/lib/email";

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

/**
 * Turn away a waitlisted coach who never submitted a card, with an optional
 * note in the email. They stay waitlisted (so still can't get in) and drop
 * off the queue.
 */
export async function rejectFromWaitlist(profileId: string, formData: FormData): Promise<void> {
  await requireVetter();
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("profiles")
    .select("id, name, email, waitlisted_at, vetting_status")
    .eq("id", profileId)
    .maybeSingle();
  if (!data?.waitlisted_at || data.vetting_status === "rejected") redirect("/admin/waitlist");

  await admin.from("profiles").update({ vetting_status: "rejected" }).eq("id", profileId);
  const note = String(formData.get("note") ?? "").trim();
  if (data.email) {
    const firstName = (data.name ?? "there").split(" ")[0];
    await sendEmail({
      to: data.email,
      subject: "About your onward/upward coach application",
      html: emailShell(
        `${firstName}, an update on your application.`,
        `<p>Thanks for your interest in coaching on onward/upward. It's not quite
         the right fit for the bench right now.</p>${
           note ? `<p style="margin-top:12px">${escapeHtml(note)}</p>` : ""
         }`,
      ),
    });
  }
  redirect("/admin/waitlist");
}
