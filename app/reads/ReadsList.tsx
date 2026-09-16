"use client";

import { useMemo, useState } from "react";
import { MultiSelect } from "@/components/MultiSelect";
import { DISCIPLINE_FILTERS } from "@/lib/coach-shared";
import type { ReadsPost } from "@/lib/mentorship-posts";
import { PostCard } from "./PostCard";

/** Two columns by four rows on desktop. */
const PAGE_SIZE = 8;

/** The byline a reader sees, so the Author filter matches what's on screen. */
const bylineOf = (p: ReadsPost) => p.author ?? p.publication;

export default function ReadsList({ posts }: { posts: ReadsPost[] }) {
  const [coachOnly, setCoachOnly] = useState(false);
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [back, setBack] = useState(false);

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
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const shown = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  function goTo(next: number) {
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

      {pageCount > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2.5">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Page ${i + 1} of ${pageCount}`}
              aria-current={i === current ? "true" : undefined}
              onClick={() => goTo(i)}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i === current ? "gold-gradient" : "bg-border-2"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
