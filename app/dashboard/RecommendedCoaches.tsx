import Link from "next/link";
import { getCoachMatches, type CoachMatch } from "@/lib/coach-match";
import { getDirectoryCoaches, type CoachRow } from "@/lib/coaches-db";
import type { Profile } from "@/lib/db";
import { MatchReason } from "@/components/MatchReason";

const SHOWN = 3;
// Filler when matching is unavailable or finds fewer than SHOWN coaches.
const CURATED_COACH_SLUGS = ["andy-polaine", "mia-blume", "judd-garratt"];

/** The member's best-fit coaches, each with why they fit; curated picks fill any gap. */
export default async function RecommendedCoaches({ user }: { user: Profile }) {
  const directory = await getDirectoryCoaches();
  const matches = await getCoachMatches(user, directory);

  const matched = directory
    .filter((c) => matches[c.id])
    .sort((a, b) => matches[a.id].rank - matches[b.id].rank);
  const curated = CURATED_COACH_SLUGS.map((s) => directory.find((c) => c.slug === s)).filter(
    (c): c is CoachRow => !!c && !matches[c.id],
  );
  const coaches = [...matched, ...curated].slice(0, SHOWN);

  return (
    <>
      {coaches.map((coach) => (
        <CoachTile key={coach.id} coach={coach} match={matches[coach.id]} />
      ))}
    </>
  );
}

function CoachTile({ coach, match }: { coach: CoachRow; match?: CoachMatch }) {
  return (
    <Link
      href={`/coaches/${coach.id}`}
      className="card-hover block rounded-[20px] border border-border-1 bg-surface-2 p-4"
    >
      <div className="flex items-center gap-3.5">
        {coach.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coach.photo_url}
            alt={coach.full_name}
            className="h-[48px] w-[48px] shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full border border-border-2 bg-surface-1 text-[15px] font-black text-secondary">
            {coach.full_name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-cream">{coach.full_name}</p>
          <p className="mt-0.5 truncate text-[12px] text-secondary">{coach.company}</p>
        </div>
      </div>
      {match ? (
        <MatchReason match={match} className="mt-3" textClassName="text-[12px]" />
      ) : (
        <p className="mt-3 line-clamp-2 text-[12px] leading-[1.5] text-secondary">
          {coach.best_for}
        </p>
      )}
    </Link>
  );
}

/** Placeholder tiles while matches are computed on a fresh profile. */
export function RecommendedCoachesSkeleton() {
  return (
    <>
      {Array.from({ length: SHOWN }, (_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-[20px] border border-border-1 bg-surface-2 p-4"
          aria-hidden
        >
          <div className="flex items-center gap-3.5">
            <span className="h-[48px] w-[48px] shrink-0 rounded-full bg-surface-1" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 rounded-full bg-surface-1" />
              <div className="h-2.5 w-1/3 rounded-full bg-surface-1" />
            </div>
          </div>
          <div className="mt-4 h-12 rounded-[14px] bg-surface-1" />
        </div>
      ))}
      <p className="text-center text-[12px] text-muted">Finding coaches who fit your profile…</p>
    </>
  );
}
