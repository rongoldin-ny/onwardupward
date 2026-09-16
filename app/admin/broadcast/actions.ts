"use server";

import { requireVetter } from "@/lib/vetting";
import { sendProductUpdate } from "@/lib/notifications";

export type BroadcastResult = { error?: string; sent?: number; recipients?: number };

/**
 * Send a product update to every member who hasn't muted them. Guarded by an
 * explicit confirmation as well as the vetter check — this one is not undoable.
 */
export async function broadcastProductUpdate(formData: FormData): Promise<BroadcastResult> {
  await requireVetter();

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const confirmed = formData.get("confirm") === "on";

  if (!subject) return { error: "Give it a subject line." };
  if (!body) return { error: "Write something to send." };
  if (!confirmed) return { error: "Tick the confirmation box first — this sends for real." };

  const { recipients, sent } = await sendProductUpdate(subject, body);
  return { recipients, sent };
}
