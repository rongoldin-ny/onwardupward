"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";

/** How long each line of the checklist holds before the next one starts. */
export const READING_STEP_MS = 1500;
const STEP_COUNT = 4;
/** Long enough to reach the last line, however quickly the read comes back. */
export const READING_MIN_MS = READING_STEP_MS * STEP_COUNT;

const LINE_WIDTHS = ["72%", "90%", "58%"];

/**
 * Shown while step 1 reads what they gave us: a blank profile card filling in,
 * over a checklist of what's happening. The last line stays open until the
 * read actually finishes.
 */
export default function ReadingProfile({ what }: { what: string }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setActive((i) => Math.min(i + 1, STEP_COUNT - 1)),
      READING_STEP_MS,
    );
    return () => clearInterval(timer);
  }, []);

  const steps = [
    `Reading ${what}`,
    "Finding your experience",
    "Working out your career stage",
    "Filling in your profile",
  ];

  return (
    <div role="status">
      <h1 className="text-[34px] leading-[1.08] font-black tracking-[-0.02em] text-cream">
        Building your profile.
      </h1>
      <p className="mt-3 text-[17px] text-secondary">This takes a few seconds.</p>

      <div
        aria-hidden
        className="relative mt-8 overflow-hidden rounded-[20px] border border-gold-border bg-surface-2 p-5"
      >
        <span className="profile-scan" />
        <div className="flex items-center gap-4">
          <span
            className={`h-[52px] w-[52px] shrink-0 rounded-full transition-colors duration-700 ${
              active > 0 ? "gold-gradient" : "bg-border-1"
            }`}
          />
          <div className="min-w-0 flex-1 space-y-2.5">
            <span className="block h-3 w-3/5 rounded-full bg-border-1">
              <span
                className="gold-gradient block h-full rounded-full transition-[width] duration-700"
                style={{ width: active > 0 ? "100%" : "0%" }}
              />
            </span>
            <span className="block h-2.5 w-2/5 rounded-full bg-border-1">
              <span
                className="gold-gradient block h-full rounded-full transition-[width] duration-700"
                style={{ width: active > 1 ? "100%" : "0%" }}
              />
            </span>
          </div>
        </div>
        <div className="mt-6 space-y-2.5">
          {LINE_WIDTHS.map((width, i) => (
            <span key={width} className="block h-2.5 rounded-full bg-border-1" style={{ width }}>
              <span
                className="gold-gradient block h-full rounded-full transition-[width] duration-700"
                style={{ width: active > i + 1 ? "100%" : "0%" }}
              />
            </span>
          ))}
        </div>
      </div>

      <ul className="mt-6 space-y-3.5">
        {steps.map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-3 text-[15px] transition-opacity duration-500 ${
              i > active ? "opacity-35" : ""
            } ${i === active ? "font-bold text-cream" : "text-secondary"}`}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              {i < active ? (
                <span className="gold-gradient flex h-5 w-5 items-center justify-center rounded-full">
                  <Check size={12} strokeWidth={3} className="text-on-gold" />
                </span>
              ) : i === active ? (
                <LoaderCircle size={18} strokeWidth={2} className="animate-spin text-gold" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-border-2" />
              )}
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
