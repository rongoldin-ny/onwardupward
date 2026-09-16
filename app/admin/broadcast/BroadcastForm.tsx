"use client";

import { useState } from "react";
import { broadcastProductUpdate, type BroadcastResult } from "./actions";

export default function BroadcastForm({ audience }: { audience: number }) {
  const [state, setState] = useState<"idle" | "sending">("idle");
  const [result, setResult] = useState<BroadcastResult | null>(null);

  async function onSubmit(formData: FormData) {
    setState("sending");
    setResult(await broadcastProductUpdate(formData));
    setState("idle");
  }

  return (
    <form action={onSubmit} className="mt-6">
      <label className="block text-[13px] font-bold text-cream" htmlFor="subject">
        Subject
      </label>
      <input
        id="subject"
        name="subject"
        required
        placeholder="What's new on onward/upward"
        className="mt-2 h-[52px] w-full rounded-[16px] border border-border-1 bg-surface-2 px-5 text-[14px] text-cream placeholder:text-muted focus:border-gold-active focus:outline-none"
      />

      <label className="mt-5 block text-[13px] font-bold text-cream" htmlFor="body">
        Message
      </label>
      <textarea
        id="body"
        name="body"
        required
        rows={8}
        placeholder={"Blank lines start a new paragraph.\n\nPlain text only — links are not parsed."}
        className="mt-2 w-full rounded-[16px] border border-border-1 bg-surface-2 p-5 text-[14px] leading-[1.6] text-cream placeholder:text-muted focus:border-gold-active focus:outline-none"
      />

      <label className="mt-5 flex items-start gap-3 text-[13px] leading-[1.5] text-body">
        <input type="checkbox" name="confirm" className="mt-0.5 h-4 w-4 shrink-0 accent-[#e8c987]" />
        <span>
          Send this to <strong className="text-cream">{audience}</strong>{" "}
          {audience === 1 ? "member" : "members"} who haven&apos;t muted product updates. This
          can&apos;t be undone.
        </span>
      </label>

      <button
        type="submit"
        disabled={state === "sending"}
        className="gold-gradient mt-6 block h-[52px] w-full rounded-full text-[15px] font-bold text-on-gold disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Send product update"}
      </button>

      {result?.error && <p className="mt-4 text-[13px] text-gold">{result.error}</p>}
      {result?.sent !== undefined && (
        <p className="mt-4 text-[13px] text-success">
          Sent {result.sent} of {result.recipients}.
          {result.sent === 0 && " Check that RESEND_API_KEY is set."}
        </p>
      )}
    </form>
  );
}
