"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { trackCoachView } from "@/app/actions/track";
import {
  CLAIM_MAILTO,
  coachFormats,
  coachLevels,
  coachPricing,
  disciplineLabel,
  TARGET_MENTEE_OPTIONS,
  type CoachRow,
} from "@/lib/coach-shared";
import { Card, Tag } from "@/components/ui";

const FORMATS = ["1:1 coaching", "Groups & cohorts", "Programs & courses"];
const PRICING = ["Published pricing", "Inquire"];
const DISCIPLINES = ["Design", "Product", "Both"];

function matchesDiscipline(coach: CoachRow, active: string[]): boolean {
  if (active.length === 0) return true;
  // No answer yet (curated seeds pre-migration) counts as "both".
  const d = coach.disciplines ?? "both";
  const label = d === "design" ? "Design" : d === "product" ? "Product" : "Both";
  if (active.includes(label)) return true;
  // "Both" coaches also match a Design-only or Product-only filter.
  return d === "both" && (active.includes("Design") || active.includes("Product"));
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-[13px] ${
        active ? "border-gold-active font-bold text-gold" : "border-border-2 text-body-2"
      }`}
    >
      {label}
    </button>
  );
}

export default function CoachesDirectory({ coaches }: { coaches: CoachRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [levels, setLevels] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [pricing, setPricing] = useState<string[]>([]);
  const [disciplines, setDisciplines] = useState<string[]>([]);

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) =>
    setter((cur) => (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]));

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

      <div className="mt-5 space-y-3">
        {(
          [
            ["Discipline", DISCIPLINES, disciplines, setDisciplines],
            ["Level", TARGET_MENTEE_OPTIONS as readonly string[], levels, setLevels],
            ["Format", FORMATS, formats, setFormats],
            ["Pricing", PRICING, pricing, setPricing],
          ] as const
        ).map(([label, options, active, setter]) => (
          <div key={label} className="flex flex-wrap items-center gap-2">
            <span className="eyebrow w-[86px] shrink-0 text-muted">{label}</span>
            {options.map((option) => (
              <Chip
                key={option}
                label={option}
                active={active.includes(option)}
                onClick={() => toggle(setter, option)}
              />
            ))}
          </div>
        ))}
      </div>

      <p className="mt-6 text-[12px] text-secondary">
        {filtered.length} {filtered.length === 1 ? "coach" : "coaches"}
      </p>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        {filtered.map((coach) => (
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
          <Card className="flex h-full flex-col">
            <div className="flex items-center gap-4">
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
                <div className="flex items-center justify-between gap-2">
                  <h2 className="truncate text-[19px] font-black tracking-[-0.02em] text-cream">
                    {coach.full_name}
                  </h2>
                  {coach.status === "approved" ? (
                    <span className="eyebrow shrink-0 rounded-full border border-gold-border px-3 py-1.5 text-gold">
                      Claimed
                    </span>
                  ) : (
                    <a
                      href={CLAIM_MAILTO}
                      onClick={(e) => {
                        e.stopPropagation();
                        void trackCoachView(coach.full_name, "claim");
                      }}
                      title="This you? Claim your slot"
                      className="eyebrow shrink-0 rounded-full border border-border-2 px-3 py-1.5 text-muted hover:border-gold-border hover:text-gold"
                    >
                      Unclaimed
                    </a>
                  )}
                </div>
                <p className="mt-1 truncate text-[13px] text-secondary">
                  {[coach.company, disciplineLabel(coach.disciplines)].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
            {coach.short_description && (
              <p className="mt-4 line-clamp-3 text-[14px] leading-[1.55] text-body-2">
                {coach.short_description}
              </p>
            )}
            {coach.offering && (
              <p className="mt-3 line-clamp-3 text-[13px] leading-[1.55] text-secondary">
                {coach.offering}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {coach.disciplines && <Tag>{disciplineLabel(coach.disciplines)}</Tag>}
              {coach.pricing && <Tag>{coach.pricing}</Tag>}
              {coachLevels(coach).map((l) => (
                <Tag key={l}>{l}</Tag>
              ))}
            </div>
            {coach.best_for && (
              <p className="mt-4 border-t border-border-1 pt-3.5 text-[13px] leading-[1.5] text-secondary">
                <span className="font-bold text-gold">Best for:</span> {coach.best_for}
              </p>
            )}
            {coach.status === "approved" && coach.booking_url && (
              <a
                href={coach.booking_url}
                target={coach.booking_url.startsWith("mailto:") ? undefined : "_blank"}
                rel="noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  void trackCoachView(coach.full_name, "book");
                }}
                className="gold-gradient cta-glow mt-4 rounded-full px-6 py-3 text-center text-[14px] font-bold text-on-gold"
              >
                Book a session
              </a>
            )}
          </Card>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="mt-6 rounded-[20px] border border-dashed border-border-2 px-5 py-8 text-center text-[14px] text-secondary">
          No coaches match — try loosening the filters.
        </p>
      )}
    </div>
  );
}
