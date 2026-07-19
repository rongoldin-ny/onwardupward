"use server";

import { requirePaidRecruiter, requireUser } from "@/lib/auth";
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
    .select("id")
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
