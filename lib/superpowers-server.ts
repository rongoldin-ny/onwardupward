import { supabaseAdmin } from "./supabase/server";
import { PRESET_SUPERPOWERS } from "./superpowers";

/**
 * Custom "Other" skills members have added, surfaced back as choosable chips
 * for everyone. Harvested straight from profiles — no separate table.
 */
export async function getCommunitySkills(): Promise<string[]> {
  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("ai_superpowers")
    .not("ai_superpowers", "eq", "[]");
  const presets = new Set(PRESET_SUPERPOWERS.map((p) => p.toLowerCase()));
  const counts = new Map<string, { skill: string; n: number }>();
  for (const row of data ?? []) {
    for (const item of (row.ai_superpowers as { skill?: string }[]) ?? []) {
      const skill = String(item?.skill ?? "").trim();
      if (!skill || presets.has(skill.toLowerCase())) continue;
      const key = skill.toLowerCase();
      counts.set(key, { skill: counts.get(key)?.skill ?? skill, n: (counts.get(key)?.n ?? 0) + 1 });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 15)
    .map((c) => c.skill);
}
