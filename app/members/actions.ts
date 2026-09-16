"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireVetter } from "@/lib/vetting";

/**
 * Remove a member from the network by archiving them — nothing is deleted.
 * Archived profiles are filtered out of every member-facing surface and email;
 * clearing `archived_at` restores them.
 */
export async function archiveMember(profileId: string): Promise<{ error?: string }> {
  const admin = await requireVetter();
  if (profileId === admin.id) return { error: "You can't remove your own account." };

  const { data, error } = await supabaseAdmin()
    .from("profiles")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", profileId)
    .eq("role", "candidate")
    .is("archived_at", null)
    .select("id");
  if (error) return { error: "Couldn't remove that member — try again." };
  if (!data?.length) return { error: "That member was already removed." };

  revalidatePath("/members");
  revalidatePath("/admin/vetting");
  return {};
}
