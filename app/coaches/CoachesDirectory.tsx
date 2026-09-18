"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Search, Sparkles } from "lucide-react";
import { trackCoachImpressions } from "@/app/actions/track";
import {
  coachFormats,
  coachLevels,
  coachPricingFacets,
  DISCIPLINE_FILTERS,
  disciplineLabel,
  PRICING_FILTERS,
  TARGET_MENTEE_OPTIONS,
  type CoachRow,
} from "@/lib/coach-shared";
import type { CoachMatch } from "@/lib/coach-match";
import { Card } from "@/components/ui";
import { MatchReason } from "@/components/MatchReason";
import { FilterRow, MultiSelect } from "@/components/MultiSelect";

const FORMATS = ["1:1 coaching", "Groups & cohorts", "Programs & courses"];
// Everything past "Design" and "Product" is a specialty tag (lib/taxonomy.ts
// COACH_SPECIALTIES) a coach sets on themselves; the first two match the
// coarser discipline field.
const SPECIALTY_FILTERS: Record<string, string> = {
  "Content Design": "content_design",
  Research: "user_research",
  Executive: "executive_coaching",
  "Startup founder": "founder_coaching",
};

function matchesDiscipline(coach: CoachRow, active: string[]): boolean {
  if (active.length === 0) return true;
  if (active.some((a) => SPECIALTY_FILTERS[a] && coach.specialties.includes(SPECIALTY_FILTERS[a]))) {
    return true;
  }
  // A selection that's only specialty tags has had its say — don't let the
  // coarse field answer for it, or picking "Executive" returns every designer.
  if (active.every((a) => SPECIALTY_FILTERS[a])) return false;
  // No answer yet (curated seeds pre-migration), and coaches covering both
  // disciplines, match a Design and/or Product filter — select both to see them.
  const d = coach.disciplines ?? "both";
  if (d === "design") return active.includes("Design");
  if (d === "product") return active.includes("Product");
  return active.includes("Design") || active.includes("Product");
}

export default function CoachesDirectory({
  coaches,
  matches: matchesPromise = null,
  reviewCounts = {},
}: {
  coaches: CoachRow[];
  /** Streams in from the server; null when the viewer isn't a member who gets matches. */
  matches?: Promise<Record<string, CoachMatch>> | null;
  reviewCounts?: Record<string, number>;
}) {
  const router = useRouter();
  const [matches, setMatches] = useState<Record<string, CoachMatch> | null>(null);
  useEffect(() => {
    let live = true;
    matchesPromise?.then((m) => {
      if (live) setMatches(m);
    });
    return () => {
      live = false;
    };
  }, [matchesPromise]);
  const matchCount = matches ? Object.keys(matches).length : 0;
  const [q, setQ] = useState("");
  const [levels, setLevels] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [pricing, setPricing] = useState<string[]>([]);
  const [disciplines, setDisciplines] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const shown = coaches.filter((c) => {
      if (
        needle &&
        ![c.full_name, c.company, c.short_description, c.offering, c.best_for, c.pricing]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle)
      )
        return false;
      if (levels.length > 0 && !coachLevels(c).some((l) => levels.includes(l))) return false;
      if (formats.length > 0 && !coachFormats(c).some((f) => formats.includes(f))) return false;
      if (pricing.length > 0 && !coachPricingFacets(c).some((f) => pricing.includes(f)))
        return false;
      if (!matchesDiscipline(c, disciplines)) return false;
      return true;
    });
    // Best matches lead, in Claude's ranking; everyone else keeps directory order.
    if (!matches) return shown;
    const rank = (c: CoachRow) => matches[c.id]?.rank ?? Infinity;
    return shown.map((c, i) => ({ c, i })).sort((a, b) => rank(a.c) - rank(b.c) || a.i - b.i).map(({ c }) => c);
  }, [coaches, q, levels, formats, pricing, disciplines, matches]);

  const lastFired = useRef<string>("");
  useEffect(() => {
    const ids = filtered.map((c) => c.id);
    const sig = [...ids].sort().join(",");
    if (sig === lastFired.current) return;
    const t = setTimeout(() => {
      lastFired.current = sig;
      void trackCoachImpressions(ids);
    }, 500);
    return () => clearTimeout(t);
  }, [filtered]);

  return (
    <div>
      <div className="relative mt-4 md:mt-8">
        <Search
          size={16}
          strokeWidth={1.5}
          className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-muted"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search coaches — name, focus, background…"
          className="h-[52px] w-full rounded-full border border-border-1 bg-surface-2 pl-12 pr-6 text-[14px] text-cream placeholder:text-muted focus:border-gold-active focus:outline-none"
        />
      </div>

      <FilterRow className="mt-4">
        <MultiSelect
          label="Discipline"
          options={DISCIPLINE_FILTERS}
          value={disciplines}
          onChange={setDisciplines}
        />
        <MultiSelect label="Level" options={TARGET_MENTEE_OPTIONS} value={levels} onChange={setLevels} />
        <MultiSelect label="Format" options={FORMATS} value={formats} onChange={setFormats} />
        <MultiSelect
          label="Pricing"
          options={PRICING_FILTERS}
          value={pricing}
          onChange={setPricing}
        />
      </FilterRow>

      <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-secondary">
        <span>
          {filtered.length} {filtered.length === 1 ? "coach" : "coaches"}
        </span>
        {matchesPromise && !matches && (
          <span className="flex items-center gap-1.5 text-muted">
            <Sparkles size={12} strokeWidth={1.5} className="animate-pulse text-gold" />
            <span className="md:hidden">Finding matches…</span>
            <span className="hidden md:inline">Finding coaches who fit your profile…</span>
          </span>
        )}
        {matchCount > 0 && (
          <span className="flex items-center gap-1.5 text-gold">
            <Sparkles size={12} strokeWidth={1.5} />
            <span className="md:hidden">
              {matchCount} {matchCount === 1 ? "match" : "matches"}
            </span>
            <span className="hidden md:inline">{matchCount} matched to your profile — shown first</span>
          </span>
        )}
      </p>

      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filtered.map((coach) => {
          const match = matches?.[coach.id];
          return (
            <div
              key={coach.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/coaches/${coach.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") router.push(`/coaches/${coach.id}`);
              }}
              className="cursor-pointer rounded-[20px]"
            >
              <Card className="flex h-full min-w-0 flex-col">
                <div className="flex min-w-0 items-center gap-4">
                  {coach.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coach.photo_url}
                      alt={coach.full_name}
                      className="h-[64px] w-[64px] shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-full border border-border-2 bg-surface-2 text-[20px] font-black text-secondary">
                      {coach.full_name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[19px] font-black tracking-[-0.02em] text-cream">
                      {coach.full_name}
                    </h2>
                    <p className="mt-1 truncate text-[13px] text-secondary">
                      {[coach.company, disciplineLabel(coach.disciplines)].filter(Boolean).join(" · ")}
                    </p>
                    {reviewCounts[coach.id] > 0 && (
                      <p className="mt-1 flex items-center gap-1 text-[12px] text-success">
                        <MessageSquare size={11} strokeWidth={1.5} />
                        {reviewCounts[coach.id]} {reviewCounts[coach.id] === 1 ? "review" : "reviews"}
                      </p>
                    )}
                  </div>
                </div>

                {coach.short_description && (
                  <p className="mt-4 line-clamp-3 text-[14px] leading-[1.55] text-body-2">
                    {coach.short_description}
                  </p>
                )}

                {coach.best_for && (
                  <p className="mt-4 border-t border-border-1 pt-3.5 text-[13px] leading-[1.5] text-secondary">
                    <span className="font-bold text-gold">Best for:</span> {coach.best_for}
                  </p>
                )}

                {match && <MatchReason match={match} className="mt-3.5" />}
              </Card>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <p className="mt-6 rounded-[20px] border border-dashed border-border-2 px-5 py-8 text-center text-[14px] text-secondary">
          No coaches match — try loosening the filters.
        </p>
      )}
    </div>
  );
}
