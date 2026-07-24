"use client";

import { useRef } from "react";
import { ImagePlus } from "lucide-react";
import {
  DISCIPLINE_OPTIONS,
  TARGET_MENTEE_OPTIONS,
  type CoachDiscipline,
} from "@/lib/coach-shared";

/** Shared building blocks for the coach listing form and the onboarding wizard. */

export function PhotoPicker({
  preview,
  onPick,
}: {
  preview: string | null;
  onPick: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-5">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        aria-label="Add photo or logo"
        className="flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-2 bg-surface-2"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus size={20} strokeWidth={1.5} className="text-secondary" />
        )}
      </button>
      <div className="text-[13px] leading-[1.5] text-secondary">
        Photo or logo.
        <br />
        Tap to {preview ? "replace" : "add"}.
      </div>
      <input
        ref={fileRef}
        type="file"
        name="photo"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(URL.createObjectURL(f));
        }}
      />
    </div>
  );
}

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
