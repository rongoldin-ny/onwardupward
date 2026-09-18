"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * The app's one modal. Everything overlaid — help, confirmations, croppers —
 * goes through here so they behave the same.
 *
 * Portalled to <body> deliberately: `position: fixed` inside a transformed
 * ancestor anchors to that ancestor instead of the viewport, and the coach
 * card lives inside FlipCard's 3D scene. Rendering in place would pin the
 * backdrop to the card.
 *
 * Handles what a dialog owes the person using it: Escape and a backdrop click
 * close it, the page behind stops scrolling, focus moves in on open and back
 * to wherever it was on close, and Tab cycles inside rather than wandering off
 * into the blurred page.
 */
const noopSubscribe = () => () => {};

export default function Modal({
  open,
  onClose,
  title,
  children,
  /** Widen for content that needs it — a cropper, a long form. */
  maxWidth = 520,
  /** "alertdialog" for a destructive confirmation the person must answer. */
  role = "dialog",
}: {
  open: boolean;
  onClose: () => void;
  /** Rendered as the heading and used as the accessible name. */
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
  role?: "dialog" | "alertdialog";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // document.body only exists on the client; false during SSR and hydration.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    // Focus the panel itself rather than the close button: a screen reader
    // then reads the title before the only thing you can do is dismiss it.
    panelRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      returnTo.current?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      // 16px gutters so the panel never touches the edge on a phone.
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[rgba(10,10,12,0.72)] px-4 py-8 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth }}
        className="my-auto max-h-[85vh] w-full overflow-y-auto rounded-[28px] border border-border-1 bg-surface-2 p-6 outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          {title ? (
            <h2 id={titleId} className="text-[20px] leading-[1.2] font-black tracking-[-0.02em] text-cream">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="-m-1 shrink-0 p-1 text-secondary"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
