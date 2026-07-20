"use client";

import { useRef, useState } from "react";
import { saveNotificationPrefs } from "@/app/actions/settings";
import type { NotificationPrefs } from "@/lib/db";

const OPTIONS: { key: keyof NotificationPrefs; label: string; note: string }[] = [
  {
    key: "messages",
    label: "New message alerts",
    note: "An email the moment a company writes to you.",
  },
  {
    key: "weekly_digest",
    label: "Weekly profile digest",
    note: "Views, ranking, and who's been looking.",
  },
  {
    key: "product_updates",
    label: "Product updates",
    note: "Occasional news from onward/upward. No noise.",
  },
];

export default function NotificationsForm({ initial }: { initial: NotificationPrefs }) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function toggle(key: keyof NotificationPrefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const result = await saveNotificationPrefs(next);
      setState(result.error ? "error" : "saved");
    }, 400);
  }

  return (
    <div>
      <div className="space-y-4">
        {OPTIONS.map((option) => {
          const on = prefs[option.key];
          return (
            <button
              key={option.key}
              type="button"
              role="switch"
              aria-checked={on}
              onClick={() => toggle(option.key)}
              className={`flex w-full items-center justify-between gap-4 rounded-[20px] border bg-surface-2 p-5 text-left ${
                on ? "border-gold-active" : "border-border-1"
              }`}
            >
              <div>
                <p className="text-[15px] font-bold text-cream">{option.label}</p>
                <p className="mt-1 text-[12.5px] text-secondary">{option.note}</p>
              </div>
              <span
                className={`relative h-[28px] w-[50px] shrink-0 rounded-full transition-colors ${
                  on ? "gold-gradient" : "bg-border-1"
                }`}
              >
                <span
                  className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-cream transition-[left] ${
                    on ? "left-[25px]" : "left-[3px]"
                  }`}
                />
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 h-4 text-[12px] text-secondary" aria-live="polite">
        {state === "saving"
          ? "Saving…"
          : state === "saved"
            ? "Saved ✓"
            : state === "error"
              ? "Couldn't save — try again."
              : ""}
      </p>
    </div>
  );
}
