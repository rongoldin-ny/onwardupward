"use client";

import { Bug, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { submitFeedback } from "@/app/actions/feedback";
import { SelectField, TextArea } from "@/components/fields";
import { Cta } from "@/components/ui";

const KINDS = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature idea" },
];

const noopSubscribe = () => () => {};

/**
 * Floating "Feedback" button that lives in the site footer — an icon-only
 * bug on every screen size (hover shows the label as a tooltip). The dialog and toast
 * are portaled to <body> so they escape the footer's pointer-events-none,
 * uppercase, letter-spaced styling.
 */
export default function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("bug");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // document.body only exists on the client; false during SSR and hydration.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!open) return;
    textRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (pending || !message.trim()) return;
    setPending(true);
    setError(null);
    const result = await submitFeedback({ kind, message, path: pathname });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setMessage("");
    setKind("bug");
    setToast("Thanks — we read every note ✓");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Feedback"
        title="Feedback"
        className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-gold-border bg-surface-2 text-gold shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
      >
        <Bug size={15} strokeWidth={2} />
      </button>

      {mounted &&
        createPortal(
          <>
            {open && (
              <div
                className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(10,10,12,0.85)] px-6"
                onClick={() => setOpen(false)}
              >
                <form
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="feedback-title"
                  onSubmit={send}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-[382px] rounded-[28px] border border-gold-border bg-surface-2 p-5"
                >
                  <div className="flex items-center justify-between">
                    <h2
                      id="feedback-title"
                      className="text-[20px] font-black tracking-[-0.02em] text-cream"
                    >
                      Send feedback
                    </h2>
                    <button
                      type="button"
                      aria-label="Close"
                      onClick={() => setOpen(false)}
                      className="text-secondary"
                    >
                      <X size={20} strokeWidth={1.5} />
                    </button>
                  </div>
                  <SelectField
                    aria-label="Type"
                    className="mt-4"
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                    options={KINDS}
                  />
                  <TextArea
                    ref={textRef}
                    aria-label="Feedback"
                    className="mt-3"
                    rows={5}
                    maxLength={5000}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      kind === "bug" ? "What happened, and what did you expect?" : "What would make this better?"
                    }
                  />
                  {error && <p className="mt-3 text-[13px] text-gold">{error}</p>}
                  <Cta type="submit" className="mt-4" disabled={pending || !message.trim()}>
                    {pending ? "Sending…" : "Submit"}
                  </Cta>
                </form>
              </div>
            )}
            <div
              role="status"
              className={`fixed top-6 left-1/2 z-50 w-[calc(100%-48px)] max-w-[382px] -translate-x-1/2 rounded-full border border-gold-border bg-surface-2 px-6 py-4 text-center text-[15px] font-medium text-cream transition-opacity duration-300 ${
                toast ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {toast}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
