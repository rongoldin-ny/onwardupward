"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Search, Sparkles } from "lucide-react";
import { trackCoachImpressions } from "@/app/actions/track";
import {
  coachFormats,
  coachLevels,
  coachPricing,
  disciplineLabel,
  TARGET_MENTEE_OPTIONS,
  type CoachRow,
} from "@/lib/coach-shared";
import type { CoachMatch } from "@/lib/coach-match";
import { Card } from "@/components/ui";
import { MultiSelect } from "@/components/MultiSelect";

const FORMATS = ["1:1 coaching", "Groups & cohorts", "Programs & courses"];
const PRICING = ["Published pricing", "Inquire"];
// "Content Design" and "Research" are the finer-grained specialty tags
// (lib/taxonomy.ts ROLE_TYPES); the rest match the coarser discipline field.
const DISCIPLINES = ["Design", "Product", "Both", "Content Design", "Research"];

function matchesDiscipline(coach: CoachRow, active: string[]): boolean {
  if (active.length === 0) return true;
  if (active.includes("Content Design") && coach.specialties.includes("content_design")) return true;
  if (active.includes("Research") && coach.specialties.includes("user_research")) return true;
  // No answer yet (curated seeds pre-migration) counts as "both".
  const d = coach.disciplines ?? "both";
  const label = d === "design" ? "Design" : d === "product" ? "Product" : "Both";
  if (active.includes(label)) return true;
  // "Both" coaches also match a Design-only or Product-only filter.
  return d === "both" && (active.includes("Design") || active.includes("Product"));
}

export default function CoachesDirectory({
  coaches,
  matches = {},
  reviewCounts = {},
}: {
  coaches: CoachRow[];
  matches?: Record<string, CoachMatch>;
  reviewCounts?: Record<string, number>;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [levels, setLevels] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [pricing, setPricing] = useState<string[]>([]);
  const [disciplines, setDisciplines] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return coaches.filter((c) => {
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
      if (pricing.length > 0 && !pricing.includes(coachPricing(c))) return false;
      if (!matchesDiscipline(c, disciplines)) return false;
      return true;
    });
  }, [coaches, q, levels, formats, pricing, disciplines]);

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
      <div className="relative mt-8">
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

      <div className="mt-4 flex flex-wrap gap-2">
        <MultiSelect label="Discipline" options={DISCIPLINES} value={disciplines} onChange={setDisciplines} />
        <MultiSelect label="Level" options={TARGET_MENTEE_OPTIONS} value={levels} onChange={setLevels} />
        <MultiSelect label="Format" options={FORMATS} value={formats} onChange={setFormats} />
        <MultiSelect label="Pricing" options={PRICING} value={pricing} onChange={setPricing} />
      </div>

      <p className="mt-6 text-[12px] text-secondary">
        {filtered.length} {filtered.length === 1 ? "coach" : "coaches"}
      </p>

      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filtered.map((coach) => {
          const match = matches[coach.id];
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
                      <p className="mt-1 flex items-center gap-1 text-[12px] text-muted">
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

                {match?.isTopMatch && (
                  <div className="mt-3.5 rounded-[14px] border border-gold-border bg-surface-1 px-4 py-3">
                    <span className="eyebrow flex items-center gap-1.5 text-gold">
                      <Sparkles size={12} strokeWidth={1.5} />
                      Top match
                    </span>
                    {match.reason && (
                      <p className="mt-1.5 text-[12.5px] leading-[1.5] text-body-2">{match.reason}</p>
                    )}
                  </div>
                )}
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
