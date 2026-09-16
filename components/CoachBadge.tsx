import { Check } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Wraps a round profile photo and, when `show` is set, hangs a green check +
 * "Coach" badge centered under it — its top edge overlapping the bottom 5%
 * of the photo. The wrapper reserves the badge's overhang so nothing below
 * collides. Used on coach detail / profile pages only; the directory is all
 * coaches, so a badge there says nothing.
 */
export function WithCoachBadge({ show, children }: { show: boolean; children: ReactNode }) {
  if (!show) return <>{children}</>;
  return (
    <span className="relative mb-4 inline-flex shrink-0">
      {children}
      <span className="absolute top-[95%] left-1/2 z-10 -translate-x-1/2">
        <span className="flex items-center gap-1.5 rounded-full border border-success/40 bg-surface-1 py-1 pr-2.5 pl-1 text-[11px] font-bold whitespace-nowrap text-success shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success text-on-gold">
            <Check size={11} strokeWidth={3.5} />
          </span>
          Coach
        </span>
      </span>
    </span>
  );
}
