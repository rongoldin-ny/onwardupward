"use client";

import {
  CERTIFICATION_OPTIONS,
  normalizeCertifications,
  DISCIPLINE_OPTIONS,
  TARGET_MENTEE_OPTIONS,
  type CoachDiscipline,
} from "@/lib/coach-shared";
import { COACH_SPECIALTIES } from "@/lib/taxonomy";
import CertificationInfo from "@/components/CertificationInfo";
import { TextField } from "@/components/fields";

/** Shared chip pickers for the coach face and the onboarding coaching step. */

/**
 * The one required chip picker: a listing that doesn't say whether it's
 * mentoring or coaching, and under what credential, is asking a member to
 * guess. Multi-select, and "Other" opens a field for naming it.
 */
export function CertificationChips({
  value,
  other,
  onChange,
  onOther,
}: {
  value: string[];
  other: string;
  onChange: (value: string[]) => void;
  onOther: (value: string) => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[13px] text-secondary">What are you certified as?</p>
        <CertificationInfo />
      </div>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {CERTIFICATION_OPTIONS.map((option) => {
          const on = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onChange(
                  on
                    ? value.filter((v) => v !== option.value)
                    : // Picking a rung of the ICF ladder steps off the one
                      // below rather than refusing the click.
                      normalizeCertifications([...value, option.value]),
                )
              }
              className={`rounded-full border px-4 py-2.5 text-[13px] ${
                on ? "border-gold-active font-bold text-gold" : "border-border-2 text-body-2"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {value.includes("other") && (
        <div className="mt-3">
          <TextField
            name="certification_other"
            placeholder="Which certification? e.g. NYU Executive Coaching"
            value={other}
            onChange={(e) => onOther(e.target.value)}
          />
        </div>
      )}
      {value.map((v) => (
        <input key={v} type="hidden" name="certifications" value={v} />
      ))}
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

export function SpecialtyChips({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <div>
      <p className="text-[13px] text-secondary">What do you specialize in coaching?</p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {COACH_SPECIALTIES.map((option) => {
          const on = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onChange(
                  on
                    ? value.filter((v) => v !== option.value)
                    : // Picking a rung of the ICF ladder steps off the one
                      // below rather than refusing the click.
                      normalizeCertifications([...value, option.value]),
                )
              }
              className={`rounded-full border px-4 py-2.5 text-[13px] ${
                on ? "border-gold-active font-bold text-gold" : "border-border-2 text-body-2"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {value.map((v) => (
        <input key={v} type="hidden" name="specialties" value={v} />
      ))}
    </div>
  );
}
