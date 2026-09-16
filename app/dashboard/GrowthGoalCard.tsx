"use client";

import Link from "next/link";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { saveGrowthGoal } from "@/app/actions/settings";
import { Card, Eyebrow } from "@/components/ui";

/**
 * The goal is what coach matching reads, so members who skipped it during
 * onboarding can fill it in here rather than being sent off to the profile.
 */
export default function GrowthGoalCard({ goal }: { goal: string | null }) {
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);
  // Set once a save lands, so the confirmation survives the switch to the saved card.
  const [justSaved, setJustSaved] = useState(false);

  async function save() {
    setState("saving");
    setError(null);
    // The action revalidates /dashboard, so it resolves once the re-matched
    // recommended coaches are ready.
    const result = await saveGrowthGoal(text);
    setState("idle");
    if (result.error) setError(result.error);
    else setJustSaved(true);
  }

  const intro = (
    <>
      <Eyebrow>Where you hope to grow</Eyebrow>
      <p className="mt-2 text-[13px] leading-[1.5] text-secondary">
        This will help you match to the right mentors and coaches.
      </p>
    </>
  );

  // Once set, the whole card links to the profile like the other home cards.
  if (goal) {
    return (
      <Link href="/profile" className="block">
        <Card className="card-hover p-6">
          {intro}
          <p className="mt-5 text-[20px] leading-[1.4] font-bold text-cream">{goal}</p>
          {justSaved && (
            <p className="mt-4 flex items-center gap-2 text-[13px] text-gold">
              <Sparkles size={14} strokeWidth={1.75} className="shrink-0" />
              Saved — your recommended coaches are now matched to this.
            </p>
          )}
          <span className="mt-4 inline-block text-[13px] font-bold text-gold">Edit in profile</span>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="card-hover p-6">
      {intro}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="What do you want to get better at this year?"
        className="mt-5 w-full rounded-[16px] border border-border-1 bg-surface-1 p-4 text-[15px] leading-[1.5] text-cream placeholder:text-muted focus:border-gold-active focus:outline-none"
      />
      <button
        type="button"
        onClick={save}
        disabled={state === "saving" || !text.trim()}
        className="gold-gradient mt-3 h-[44px] rounded-full px-6 text-[14px] font-bold text-on-gold disabled:opacity-50"
      >
        {state === "saving" ? "Saving & rematching coaches…" : "Save"}
      </button>
      {error && <p className="mt-3 text-[13px] text-gold">{error}</p>}
    </Card>
  );
}
