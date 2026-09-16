"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MultiSelect } from "@/components/MultiSelect";
import { DISCIPLINE_FILTERS } from "@/lib/coach-shared";
import type { ReadsPost } from "@/lib/mentorship-posts";
import { PostCard } from "./PostCard";

/** Two columns by four rows on desktop (matches the lg breakpoint below). */
const PAGE_SIZE_DESKTOP = 8;
/** A single column of cards has to fit a phone viewport with no scroll. */
const PAGE_SIZE_MOBILE = 3;

/** The byline a reader sees, so the Author filter matches what's on screen. */
const bylineOf = (p: ReadsPost) => p.author ?? p.publication;

export default function ReadsList({ posts }: { posts: ReadsPost[] }) {
  const [coachOnly, setCoachOnly] = useState(false);
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [back, setBack] = useState(false);
  // Desktop by default so the server-rendered grid isn't cut down, then
  // corrected on mount for phones — matches the lg:grid-cols-2 breakpoint.
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DESKTOP);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setPageSize(mq.matches ? PAGE_SIZE_DESKTOP : PAGE_SIZE_MOBILE);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const authorOptions = useMemo(
    () => [...new Set(posts.map(bylineOf))].sort(),
    [posts],
  );

  const filtered = useMemo(
    () =>
      posts.filter((p) => {
        if (coachOnly && !p.isCoach) return false;
        if (disciplines.length > 0 && !p.disciplines.some((d) => disciplines.includes(d)))
          return false;
        if (authors.length > 0 && !authors.includes(bylineOf(p))) return false;
        return true;
      }),
    [posts, coachOnly, disciplines, authors],
  );

  // Clamp rather than reset, so narrowing the list can never strand the reader
  // on a page that no longer exists.
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const shown = filtered.slice(current * pageSize, current * pageSize + pageSize);

  function goTo(next: number) {
    if (next < 0 || next > pageCount - 1) return;
    setBack(next < current);
    setPage(next);
  }

  function changeFilter<T>(next: T, set: (v: T) => void) {
    set(next);
    setBack(false);
    setPage(0);
  }

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label
          className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-[13px] ${
            coachOnly ? "border-gold-active font-bold text-gold" : "border-border-2 text-body-2"
          }`}
        >
          <input
            type="checkbox"
            checked={coachOnly}
            onChange={(e) => changeFilter(e.target.checked, setCoachOnly)}
            className="h-3.5 w-3.5 accent-[#e8c987]"
          />
          From our coaches
        </label>
        <MultiSelect
          label="Discipline"
          options={DISCIPLINE_FILTERS}
          value={disciplines}
          onChange={(next) => changeFilter(next, setDisciplines)}
        />
        {authorOptions.length > 1 && (
          <MultiSelect
            label="Author"
            options={authorOptions}
            value={authors}
            onChange={(next) => changeFilter(next, setAuthors)}
          />
        )}
      </div>

      <p className="mt-4 text-[12px] text-secondary">
        {filtered.length} {filtered.length === 1 ? "post" : "posts"}
        {filtered.length !== posts.length && ` of ${posts.length}`}
      </p>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            disabled={current === 0}
            onClick={() => goTo(current - 1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-secondary disabled:opacity-30"
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Page ${i + 1} of ${pageCount}`}
              aria-current={i === current ? "true" : undefined}
              onClick={() => goTo(i)}
              className="flex h-9 w-9 shrink-0 items-center justify-center"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  i === current ? "gold-gradient" : "bg-border-2 hover:bg-gold-border"
                }`}
              />
            </button>
          ))}
          <button
            type="button"
            aria-label="Next page"
            disabled={current === pageCount - 1}
            onClick={() => goTo(current + 1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-secondary disabled:opacity-30"
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      )}

      {shown.length > 0 ? (
        // Keyed by page so React remounts the grid and replays the slide.
        <div
          key={current}
          className={`mt-4 grid gap-4 lg:grid-cols-2 ${
            back ? "reads-page-back" : "reads-page-forward"
          }`}
        >
          {shown.map((post) => (
            <PostCard key={post.url} post={post} />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-[14px] text-secondary">
          Nothing matches those filters — try loosening them.
        </p>
      )}
    </div>
  );
}
