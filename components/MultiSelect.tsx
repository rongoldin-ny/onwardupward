"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] ${
          value.length > 0 ? "border-gold-active font-bold text-gold" : "border-border-2 text-body-2"
        }`}
      >
        {label}
        {value.length > 0 && <span>({value.length})</span>}
        <ChevronDown size={14} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute top-11 left-0 z-20 w-52 max-w-[80vw] rounded-[16px] border border-border-1 bg-surface-2 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[13px] text-body"
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
