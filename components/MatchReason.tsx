import { Sparkles } from "lucide-react";
import type { CoachMatch } from "@/lib/coach-match";

/** The "why this coach fits you" callout on coach cards and listings. */
export function MatchReason({
  match,
  className = "",
  textClassName = "text-[12.5px]",
}: {
  match: CoachMatch;
  className?: string;
  textClassName?: string;
}) {
  return (
    <div className={`rounded-[14px] bg-surface-1 px-4 py-3 ${className}`}>
      <span className="eyebrow flex items-center gap-1.5 text-gold">
        <Sparkles size={12} strokeWidth={1.5} />
        {match.fit === "strong" ? "Top match" : "Good fit"}
      </span>
      {match.reason && (
        <p className={`mt-1.5 leading-[1.5] text-body-2 ${textClassName}`}>{match.reason}</p>
      )}
    </div>
  );
}
