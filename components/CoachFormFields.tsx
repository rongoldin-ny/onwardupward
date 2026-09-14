"use client";

import {
  DISCIPLINE_OPTIONS,
  TARGET_MENTEE_OPTIONS,
  type CoachDiscipline,
} from "@/lib/coach-shared";

/** Shared chip pickers for the coach face and the onboarding coaching step. */

export function DisciplineChips({
  value,
  onChange,
}: {
  value: CoachDiscipline | null;
  onChange: (value: CoachDiscipline) => void;
}) {
  return (
    <div>
      <p className="text-[13px] text-secondary">What disciplines do you coach for?</p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {DISCIPLINE_OPTIONS.map((option) => {
          const on = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-full border px-4 py-2.5 text-[13px] ${
                on ? "border-gold-active font-bold text-gold" : "border-border-2 text-body-2"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <input type="hidden" name="disciplines" value={value ?? ""} />
    </div>
  );
}

export function MenteeChips({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <div>
      <p className="text-[13px] text-secondary">Who do you mentor?</p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {TARGET_MENTEE_OPTIONS.map((option) => {
          const on = value.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(on ? value.filter((m) => m !== option) : [...value, option])}
              className={`rounded-full border px-4 py-2.5 text-[13px] ${
                on ? "border-gold-active font-bold text-gold" : "border-border-2 text-body-2"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {value.map((m) => (
        <input key={m} type="hidden" name="target_mentees" value={m} />
      ))}
    </div>
  );
}
