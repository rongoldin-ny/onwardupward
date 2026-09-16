"use client";

import type { ReactNode } from "react";

export type CardSide = "player" | "coach";

/** Player / Coach faces on one 3D card, switched by a segmented control. */
export default function FlipCard({
  side,
  onSide,
  front,
  back,
}: {
  side: CardSide;
  onSide: (side: CardSide) => void;
  front: ReactNode;
  back: ReactNode;
}) {
  return (
    <div>
      <div
        role="tablist"
        aria-label="Card side"
        className="mx-auto flex w-fit gap-1 rounded-full border border-border-1 bg-surface-2 p-1 lg:mx-0"
      >
        {(["player", "coach"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={side === s}
            onClick={() => onSide(s)}
            className={`rounded-full px-5 py-2 text-[13px] font-bold transition-colors ${
              side === s ? "gold-gradient text-on-gold" : "text-secondary"
            }`}
          >
            {s === "player" ? "Profile" : "Coach"}
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
