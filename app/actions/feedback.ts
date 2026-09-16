"use server";

import { currentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Stores a bug report or feature idea from the footer widget. Written via the
 * admin client so signed-out visitors can send feedback too.
 */
export async function submitFeedback(input: {
  kind: string;
  message: string;
  path: string;
}): Promise<{ error?: string }> {
  const kind = input.kind === "bug" || input.kind === "feature" ? input.kind : null;
  const message = String(input.message ?? "").trim().slice(0, 5000);
  if (!kind) return { error: "Pick bug or feature idea." };
  if (!message) return { error: "Add a few words first." };

  const user = await currentUser().catch(() => null);
  const path = String(input.path ?? "").slice(0, 200);
  const { error } = await supabaseAdmin()
    .from("feedback")
    .insert({ user_id: user?.id ?? null, kind, message, path: path.startsWith("/") ? path : null });
  if (error) {
    console.error("submitFeedback failed:", error.message);
    return { error: "Couldn't send that — try again." };
  }
  return {};
}
