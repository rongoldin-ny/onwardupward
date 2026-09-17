"use client";

import type { ReactNode } from "react";

export type CardSide = "player" | "coach";

/** Player / Coach faces on one 3D card, switched by a segmented control. */
export default function FlipCard({
  side,
  onSide,
  front,
  back,
  needsAttention = { player: false, coach: false },
}: {
  side: CardSide;
  onSide: (side: CardSide) => void;
  front: ReactNode;
  back: ReactNode;
  /** Owner-only: a red dot on the side that's still missing something required. */
  needsAttention?: Record<CardSide, boolean>;
}) {
  return (
    <div>
      <div
        role="tablist"
        aria-label="Card side"
        className="mx-auto flex w-fit gap-1 rounded-full border border-border-1 bg-surface-2 p-1"
      >
        {(["player", "coach"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={side === s}
            onClick={() => onSide(s)}
            className={`relative rounded-full px-5 py-2 text-[13px] font-bold transition-colors ${
              side === s ? "gold-gradient text-on-gold" : "text-secondary"
            }`}
          >
            {s === "player" ? "Profile" : "Coach"}
            {needsAttention[s] && (
              <>
                <span
                  aria-hidden
                  className="absolute top-0.5 right-1 h-[7px] w-[7px] rounded-full bg-alert ring-2 ring-surface-2"
                />
                <span className="sr-only"> — needs attention</span>
              </>
            )}
          </button>
        ))}
      </div>
      <div className={`flip-scene mt-4 ${side === "coach" ? "is-flipped" : ""}`}>
        <div className="flip-inner">
          <div className="flip-face" inert={side !== "player"}>
            {front}
          </div>
          <div className="flip-face flip-back" inert={side !== "coach"}>
            {back}
          </div>
        </div>
      </div>
    </div>
  );
}
