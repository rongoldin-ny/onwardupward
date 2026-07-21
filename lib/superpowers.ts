/** AI superpowers — client-safe constants and types. */

export type SuperpowerXp = "basic" | "fluent" | "expert";

export type Superpower = { skill: string; xp: SuperpowerXp };

export const PRESET_SUPERPOWERS = [
  "Vibecoding",
  "Pushing PRs",
  "Generative Art",
  "Generative Video",
  "Generative Audio/Music",
  "AI Writing",
  "Creating Agents",
  "Creating Skills",
  "AI Plugins",
  "AI × Design Systems",
  "Claude Code",
  "Lovable",
  "Codex",
  "Figma Make",
  "Databases",
] as const;

export const XP_LEVELS: { value: SuperpowerXp; label: string; hint: string }[] = [
  { value: "basic", label: "Basic", hint: "Getting going" },
  { value: "fluent", label: "Fluent", hint: "Daily driver" },
  { value: "expert", label: "Expert", hint: "Can teach a class" },
];

export const XP_RANK: Record<SuperpowerXp, number> = { basic: 0, fluent: 1, expert: 2 };

/** Parse + sanitize a submitted superpowers JSON payload. */
export function sanitizeSuperpowers(raw: string): Superpower[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const out: Superpower[] = [];
    for (const item of parsed) {
      const skill = String(item?.skill ?? "").trim().slice(0, 40);
      const xp = String(item?.xp ?? "");
      if (!skill || seen.has(skill.toLowerCase())) continue;
      if (xp !== "basic" && xp !== "fluent" && xp !== "expert") continue;
      seen.add(skill.toLowerCase());
      out.push({ skill, xp: xp as SuperpowerXp });
      if (out.length >= 20) break;
    }
    return out;
  } catch {
    return [];
  }
}
