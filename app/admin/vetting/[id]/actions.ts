"use server";

import { redirect } from "next/navigation";
import { requireVetter } from "@/lib/vetting";
import { supabaseAdmin } from "@/lib/supabase/server";
import { emailShell, sendEmail } from "@/lib/email";

/** Let a pending member in: flip their status and send the welcome email. */
export async function approveCandidate(profileId: string): Promise<void> {
  await requireVetter();
  const admin = supabaseAdmin();

  const { data } = await admin
    .from("profiles")
    .select("id, name, email, vetting_status")
    .eq("id", profileId)
    .eq("role", "candidate")
    .maybeSingle();
  if (!data) redirect("/admin/vetting");

  if (data.vetting_status !== "approved") {
    await admin.from("profiles").update({ vetting_status: "approved" }).eq("id", profileId);

    if (data.email) {
      const firstName = (data.name ?? "there").split(" ")[0];
      await sendEmail({
        to: data.email,
        subject: "You're in — welcome to onward/upward",
        html: emailShell(
          `${firstName}, you're in.`,
          `<p>Your profile has been reviewed and accepted. You're now part of a
           private growth network for designers — visible to vetted recruiters,
           hiring managers and coaches.</p>
           <p style="margin-top:12px">While you're here, browse the bench of
           <a href="https://onwardupward.io/coaches" style="color:#e8c987">design
           leadership coaches</a> who've made the climb you're on.</p>`,
          { label: "Sign in to onward/upward", url: "https://onwardupward.io/signin" },
        ),
      });
    }
  }
  redirect("/admin/vetting");
}
