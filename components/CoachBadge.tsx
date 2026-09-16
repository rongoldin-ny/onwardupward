import { Check } from "lucide-react";
import type { ReactNode } from "react";

/** Green check + "Coach" pill that marks a coach's photo. */
function CoachBadge({ size }: { size: "sm" | "md" }) {
  const sm = size === "sm";
  return (
    <span
      className={`flex items-center rounded-full border border-success/40 bg-surface-1 font-bold whitespace-nowrap text-success shadow-[0_2px_8px_rgba(0,0,0,0.4)] ${
        sm ? "gap-1 py-0.5 pr-1.5 pl-0.5 text-[9px]" : "gap-1.5 py-1 pr-2.5 pl-1 text-[11px]"
      }`}
    >
      <span
        className={`flex items-center justify-center rounded-full bg-success text-on-gold ${
          sm ? "h-3 w-3" : "h-4 w-4"
        }`}
      >
        <Check size={sm ? 8 : 11} strokeWidth={3.5} />
      </span>
      Coach
    </span>
  );
}

/**
 * Wraps a round profile photo and, when `show` is set, hangs the Coach badge
 * centered under it — its top edge overlapping the bottom 5% of the photo.
 * The wrapper reserves the badge's overhang so nothing below collides.
 */
export function WithCoachBadge({
  show,
  size = "md",
  className = "",
  children,
}: {
  show: boolean;
  size?: "sm" | "md";
  className?: string;
  children: ReactNode;
}) {
  if (!show) return <>{children}</>;
  return (
    <span className={`relative inline-flex shrink-0 ${size === "sm" ? "mb-3" : "mb-4"} ${className}`}>
      {children}
      <span className="absolute top-[95%] left-1/2 z-10 -translate-x-1/2">
        <CoachBadge size={size} />
      </span>
    </span>
  );
}
