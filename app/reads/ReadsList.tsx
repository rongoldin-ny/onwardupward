"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FilterRow, MultiSelect } from "@/components/MultiSelect";
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

  // No Discipline facet for now: a post inherits its tags wholesale from the
  // coach who wrote it, and a "both" coach answers to Design and Product alike,
  // so research writing surfaced under Design. Curated feeds carry no tags at
  // all, so any selection hid them entirely. Bring it back once posts are
  // tagged by their own content.
  const filtered = useMemo(
    () =>
      posts.filter((p) => {
        if (coachOnly && !p.isCoach) return false;
        if (authors.length > 0 && !authors.includes(bylineOf(p))) return false;
        return true;
      }),
    [posts, coachOnly, authors],
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

  // Mobile swipe between pages — horizontal drags only, so a vertical
  // scroll (or a tap that opens a PostCard link) never gets hijacked.
  const touchStart = useRef({ x: 0, y: 0 });
  const SWIPE_THRESHOLD = 48;

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    goTo(dx < 0 ? current + 1 : current - 1);
  }

  return (
    <div>
      <FilterRow className="mt-4">
        <label
          className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-[13px] whitespace-nowrap ${
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
        {authorOptions.length > 1 && (
          <MultiSelect
            label="Author"
            options={authorOptions}
            value={authors}
            onChange={(next) => changeFilter(next, setAuthors)}
          />
        )}
      </FilterRow>

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
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className={`mt-4 grid touch-pan-y gap-4 lg:grid-cols-2 ${
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
