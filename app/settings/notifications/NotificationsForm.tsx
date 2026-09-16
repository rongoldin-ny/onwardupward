"use client";

import { useRef, useState } from "react";
import { saveCoachContact, saveNotificationPrefs } from "@/app/actions/settings";
import type { NotificationPrefs } from "@/lib/db";

const OPTIONS: { key: keyof NotificationPrefs; label: string; note: string }[] = [
  {
    key: "messages",
    label: "New message alerts",
    note: "A notification the moment someone tries to connect.",
  },
  {
    key: "weekly_digest",
    label: "Weekly profile digest",
    note: "Your views and how they rank, every Monday.",
  },
  {
    key: "product_updates",
    label: "Product updates",
    note: "Occasional news from onward/upward. No noise.",
  },
];

export default function NotificationsForm({
  initial,
  allowCoachContact,
}: {
  initial: NotificationPrefs;
  allowCoachContact: boolean;
}) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial);
  const [contact, setContact] = useState(allowCoachContact);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Not one of the notification_prefs keys — it decides whether a coach can
  // write at all, rather than which of our emails you get — but it belongs
  // next to them, because it's the same question: what reaches your inbox.
  function toggleContact() {
    const next = !contact;
    setContact(next);
    setState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const result = await saveCoachContact(next);
      setState(result.error ? "error" : "saved");
    }, 400);
  }

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

  const switchClass = (on: boolean) =>
    `flex w-full items-center justify-between gap-4 rounded-[20px] border bg-surface-2 p-5 text-left ${
      on ? "border-gold-active" : "border-border-1"
    }`;

  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={contact}
        onClick={toggleContact}
        className={switchClass(contact)}
      >
        <div>
          <p className="text-[15px] font-bold text-cream">Allow coaches to contact me</p>
          <p className="mt-1 text-[12.5px] text-secondary">
            They message you through onward/upward. Your email address stays private either way.
          </p>
        </div>
        <Toggle on={contact} />
      </button>

      <p className="mt-7 mb-4 eyebrow text-muted">From us</p>

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
              className={switchClass(on)}
            >
              <div>
                <p className="text-[15px] font-bold text-cream">{option.label}</p>
                <p className="mt-1 text-[12.5px] text-secondary">{option.note}</p>
              </div>
              <Toggle on={on} />
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

/** The gold pill switch shared by every row above. */
function Toggle({ on }: { on: boolean }) {
  return (
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
  );
}
