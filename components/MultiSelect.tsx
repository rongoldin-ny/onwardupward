"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";

/** Menu width in px — keep in sync with the w-52 class below. */
const MENU_WIDTH = 208;
/** Minimum distance between the menu and the viewport edge. */
const EDGE = 16;

/**
 * A row of filter controls. Mobile: a single swipeable line that bleeds off
 * the right edge of the screen instead of wrapping into a tall block — the
 * negative margins cancel the page gutter (px-7) so chips scroll edge to edge.
 * Desktop: wraps normally.
 */
export function FilterRow({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`no-scrollbar -mx-7 flex items-center gap-2 overflow-x-auto px-7 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 ${className}`}
    >
      {children}
    </div>
  );
}

/** A compact multiselect dropdown — swaps a row of toggle chips for one button per filter group. */
export function MultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // The menu is position: fixed, pinned under its button. An absolute menu
  // would be clipped by FilterRow's horizontal scroll container on mobile.
  // Scroll listeners use capture so the carousel's own scroll moves it too.
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const r = buttonRef.current?.getBoundingClientRect();
      if (!r) return;
      const maxLeft = window.innerWidth - MENU_WIDTH - EDGE;
      setPos({ top: r.bottom + 8, left: Math.max(EDGE, Math.min(r.left, maxLeft)) });
    }
    place();
    window.addEventListener("scroll", place, { capture: true, passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, { capture: true });
      window.removeEventListener("resize", place);
    };
  }, [open]);

  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] whitespace-nowrap ${
          value.length > 0 ? "border-gold-active font-bold text-gold" : "border-border-2 text-body-2"
        }`}
      >
        {label}
        {value.length > 0 && <span>({value.length})</span>}
        <ChevronDown size={14} strokeWidth={1.5} />
      </button>
      {open && pos && (
        <div
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-30 w-52 rounded-[16px] border border-border-1 bg-surface-2 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className="list-row flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[13px] text-body"
            >
              {option}
              {value.includes(option) && <Check size={14} strokeWidth={2} className="shrink-0 text-gold" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
