"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

/**
 * A one-shot confirmation for people arriving from a redirect.
 *
 * It sits in the page flow instead of floating: the fixed nav owns the
 * top-right corner on every screen, and mobile browser chrome clips anything
 * pinned to the bottom. Fades itself out, but stays dismissible so it never
 * outlasts its welcome on a slow read.
 */
export default function FlashToast({
  message,
  seconds = 9,
}: {
  message: string;
  seconds?: number;
}) {
  const [gone, setGone] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fade = setTimeout(() => setFading(true), seconds * 1000);
    const hide = setTimeout(() => setGone(true), seconds * 1000 + 600);
    return () => {
      clearTimeout(fade);
      clearTimeout(hide);
    };
  }, [seconds]);

  if (gone) return null;

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-[20px] border border-gold-border bg-gold-tint p-4 transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold-active text-gold">
        <Check size={12} strokeWidth={2.5} />
      </span>
      <p className="min-w-0 flex-1 text-[14px] leading-[1.5] font-bold text-cream">{message}</p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setGone(true)}
        className="-m-1 shrink-0 p-1 text-secondary"
      >
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}
