"use client";

import { Pencil } from "lucide-react";

/**
 * Owner-only "what's left" card, shown above the card it belongs to — the
 * Profile side's gaps on the Profile tab, the listing's on the Coach tab.
 * There's deliberately only ever one on screen: two of these, each asking the
 * owner to "finish your profile" about different fields, read as a conflict.
 * Hidden once nothing is missing.
 */
export default function CompletionCard({
  pct,
  heading,
  missing,
  ctaLabel,
  ctaLabelShort,
  onEdit,
}: {
  pct: number;
  heading: string;
  missing: string[];
  ctaLabel: string;
  /** Mobile label — the full one wraps badly at 375px. */
  ctaLabelShort: string;
  onEdit: () => void;
}) {
  if (missing.length === 0) return null;

  return (
    <section className="mb-5 rounded-[20px] border border-gold-border bg-gold-tint p-5 lg:mb-6 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="w-full min-w-0 sm:w-auto sm:flex-1">
          <p className="eyebrow text-gold">{pct}% complete</p>
          <h2 className="mt-2 text-[18px] leading-[1.2] font-black tracking-[-0.02em] text-cream">
            {heading}
          </h2>
          <div className="mt-2.5 h-[4px] w-full max-w-[420px] overflow-hidden rounded-full bg-border-1">
            <div className="gold-gradient h-full rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="gold-gradient cta-glow order-last flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-bold text-on-gold sm:order-none sm:w-auto"
        >
          <Pencil size={14} strokeWidth={2} />
          <span className="sm:hidden">{ctaLabelShort}</span>
          <span className="hidden sm:inline">{ctaLabel}</span>
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {missing.map((label) => (
          <span
            key={label}
            className="rounded-full border border-gold-active bg-surface-1 px-3 py-1.5 text-[12px] font-bold text-gold"
          >
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
