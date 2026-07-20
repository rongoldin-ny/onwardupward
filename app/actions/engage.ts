"use server";

import { requirePaidRecruiter, requireUser } from "@/lib/auth";
import { emailShell, sendEmail } from "@/lib/email";
import { supabaseServer } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/db";

export async function sendMessage(
  recipientId: string,
  body: string,
): Promise<{ error?: string }> {
  const user = await requirePaidRecruiter();
  const trimmed = body.trim();
  if (!trimmed) return { error: "Write a message first." };

  const supabase = await supabaseServer();
  const { data: recipient } = await supabase
    .from("profiles")
    .select("id, name, email, notification_prefs")
    .eq("id", recipientId)
    .eq("role", "candidate")
    .maybeSingle();
  if (!recipient) return { error: "That profile no longer exists." };

  const { error } = await supabase.from("messages").insert({
    sender_id: user.id,
    recipient_id: recipientId,
    body: trimmed,
  });
  if (error) return { error: "Couldn't send that — try again." };

  await trackEvent(user.id, "message_sent", recipientId, { recipient_id: recipientId });

  // Notify the candidate by email, honoring their notifications setting.
  const prefs = (recipient.notification_prefs ?? {}) as { messages?: boolean };
  if (recipient.email && prefs.messages !== false) {
    const firstName = (recipient.name ?? "there").split(" ")[0];
    await sendEmail({
      to: recipient.email,
      subject: "A company just wrote to you on onward/upward",
      html: emailShell(
        `${firstName}, someone's interested.`,
        `<p>A recruiter or hiring manager just sent you a message. Sign in to
         read it and reply on your terms.</p>
         <p style="margin-top:12px;font-size:13px;color:#8d8677">You can turn
         these alerts off any time in Settings → Notifications.</p>`,
        { label: "Read the message", url: "https://onwardupward.io/dashboard" },
      ),
    });
  }
  return {};
}

export async function trackElementClick(
  targetProfileId: string,
  element: "linkedin" | "reference" | "portfolio" | "contact",
) {
  const user = await requireUser();
  await trackEvent(user.id, "element_click", targetProfileId, {
    target_profile_id: targetProfileId,
    element,
  });
}
