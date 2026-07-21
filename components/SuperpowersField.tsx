"use client";

import { useState } from "react";
import {
  PRESET_SUPERPOWERS,
  XP_LEVELS,
  XP_RANK,
  type Superpower,
  type SuperpowerXp,
} from "@/lib/superpowers";

/**
 * AI superpowers picker: multi-select chips (presets + community customs +
 * freeform "Other") with a three-stop XP slider per selected skill. Emits the
 * whole selection as one hidden JSON input named ai_superpowers.
 */
export default function SuperpowersField({
  initial,
  communitySkills = [],
  onChange,
}: {
  initial: Superpower[];
  communitySkills?: string[];
  onChange?: () => void;
}) {
  const [selected, setSelectedRaw] = useState<Superpower[]>(initial);
  const setSelected = (next: Superpower[]) => {
    setSelectedRaw(next);
    onChange?.();
  };
  const [custom, setCustom] = useState("");

  const chips = [
    ...new Set([
      ...selected.map((s) => s.skill),
      ...PRESET_SUPERPOWERS,
      ...communitySkills,
    ]),
  ];

  const get = (skill: string) => selected.find((s) => s.skill.toLowerCase() === skill.toLowerCase());

  function toggle(skill: string) {
    const existing = get(skill);
    setSelected(
      existing
        ? selected.filter((s) => s !== existing)
        : [...selected, { skill, xp: "fluent" as SuperpowerXp }],
    );
  }

  function commitCustom() {
    const value = custom.trim().slice(0, 40);
    if (value && !get(value)) setSelected([...selected, { skill: value, xp: "fluent" }]);
    setCustom("");
  }

  function setXp(skill: string, xp: SuperpowerXp) {
    setSelected(selected.map((s) => (s.skill === skill ? { ...s, xp } : s)));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {chips.map((skill) => {
          const on = !!get(skill);
          return (
            <button
              key={skill}
              type="button"
              onClick={() => toggle(skill)}
              className={`rounded-full border px-4 py-2.5 text-[13px] ${
                on ? "border-gold-active font-bold text-gold" : "border-border-2 text-body-2"
              }`}
            >
              {skill}
            </button>
          );
        })}
      </div>
      <input
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        onBlur={commitCustom}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commitCustom();
          }
        }}
        placeholder="Other — add your own, press enter"
        className="mt-4 h-[46px] w-full rounded-full border border-border-1 bg-surface-2 px-5 text-[13px] text-cream placeholder:text-muted focus:border-gold-active focus:outline-none"
      />

      {selected.length > 0 && (
        <div className="mt-5 space-y-4">
          {selected.map((s) => {
            const rank = XP_RANK[s.xp];
            return (
              <div key={s.skill} className="rounded-[18px] border border-border-1 bg-surface-2 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-[14px] font-bold text-cream">{s.skill}</p>
                  <p className="shrink-0 text-[12px] text-gold">
                    {XP_LEVELS[rank].label}
                    <span className="text-secondary"> — {XP_LEVELS[rank].hint}</span>
                  </p>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={1}
                  value={rank}
                  onChange={(e) => setXp(s.skill, XP_LEVELS[Number(e.target.value)].value)}
                  aria-label={`${s.skill} experience level`}
                  className="mt-3 w-full accent-[#E8C987]"
                />
                <div className="mt-1 flex justify-between text-[10px] tracking-[0.08em] text-muted uppercase">
                  <span>Basic</span>
                  <span>Fluent</span>
                  <span>Expert</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <input type="hidden" name="ai_superpowers" value={JSON.stringify(selected)} />
    </div>
  );
}
