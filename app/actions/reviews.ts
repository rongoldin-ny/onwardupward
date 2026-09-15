"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

/** A signed-in member writes (or edits) their review of a coach — one per (coach, reviewer). */
export async function submitCoachReview(
  coachId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const user = await requireUser();
  if (user.role !== "candidate" && user.role !== "coach") {
    return { error: "Reviews are for members and coaches." };
  }

  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const helpedWith = str("helped_with");
  const outcome = str("outcome");
  const comments = str("comments");
  if (!helpedWith || !outcome) {
    return { error: "Add what you got help with and the outcome." };
  }

  const { error } = await supabaseAdmin()
    .from("coach_reviews")
    .upsert(
      {
        coach_id: coachId,
        reviewer_id: user.id,
        helped_with: helpedWith,
        outcome,
        comments: comments || null,
      },
      { onConflict: "coach_id,reviewer_id" },
    );
  if (error) {
    console.error("submitCoachReview failed:", error.message);
    return { error: "Couldn't save your review — try again." };
  }

  revalidatePath(`/coaches/${coachId}`);
  revalidatePath("/coaches");
  return {};
}
