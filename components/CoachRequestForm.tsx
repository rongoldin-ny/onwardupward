"use client";

import { useState } from "react";
import { requestCoaching } from "@/app/actions/coach-requests";

/**
 * "Book a session" for a claimed coach: a note sent through the platform.
 *
 * Deliberately not a <form> — this renders inside ProfilePage's outer autosave
 * form, and browsers reassociate a nested form's submit button with the outer
 * one. The action is called directly from a plain button instead.
 */
export default function CoachRequestForm({
  coachId,
  coachName,
  label = "Book a session",
}: {
  coachId: string;
  coachName: string;
  /** Text on the collapsed button. */
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const firstName = (coachName || "there").split(" ")[0];

  async function send() {
    setState("sending");
    setError(null);
    const result = await requestCoaching(coachId, message);
    if (result.error) {
      setError(result.error);
      setState("idle");
      return;
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="rounded-[20px] border border-gold-border bg-gold-tint px-6 py-5 text-center">
        <p className="text-[15px] font-bold text-gold">Sent to {firstName}.</p>
        <p className="mt-1.5 text-[13px] leading-[1.5] text-secondary">
          They&apos;ll reply straight to your email.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="gold-gradient cta-glow block w-full rounded-full px-6 py-4 text-center text-[15px] font-bold text-on-gold"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="rounded-[20px] border border-border-1 bg-surface-2 p-5">
      <p className="text-[15px] font-bold text-cream">Message {firstName}</p>
      <p className="mt-1.5 text-[13px] leading-[1.5] text-secondary">
        Your profile goes with it, so you don&apos;t have to explain your whole background.
      </p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        maxLength={2000}
        autoFocus
        placeholder="What you're working on, and what you'd like help with."
        className="mt-4 w-full rounded-[16px] border border-border-1 bg-surface-1 p-4 text-[14px] leading-[1.5] text-cream placeholder:text-muted focus:border-gold-active focus:outline-none"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={send}
          disabled={state === "sending" || !message.trim()}
          className="gold-gradient h-[44px] rounded-full px-6 text-[14px] font-bold text-on-gold disabled:opacity-50"
        >
          {state === "sending" ? "Sending…" : "Send request"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[13px] font-bold text-secondary"
        >
          Cancel
        </button>
      </div>
      {error && <p className="mt-3 text-[13px] text-gold">{error}</p>}
    </div>
  );
}
