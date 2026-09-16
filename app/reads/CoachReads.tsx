"use client";

import { useMemo, useState } from "react";
import { MultiSelect } from "@/components/MultiSelect";
import { DISCIPLINE_FILTERS } from "@/lib/coach-shared";
import type { ReadsPost } from "@/lib/mentorship-posts";
import { PostCard } from "./PostCard";

/** Two columns by four rows on desktop. */
const PAGE_SIZE = 8;

export default function CoachReads({ posts }: { posts: ReadsPost[] }) {
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [page, setPage] = useState(0);

  const authorOptions = useMemo(
    () => [...new Set(posts.map((p) => p.author).filter((a): a is string => !!a))].sort(),
    [posts],
  );

  const filtered = useMemo(
    () =>
      posts.filter((p) => {
        if (disciplines.length > 0 && !p.disciplines.some((d) => disciplines.includes(d)))
          return false;
        if (authors.length > 0 && !(p.author && authors.includes(p.author))) return false;
        return true;
      }),
    [posts, disciplines, authors],
  );

  // Clamp rather than reset on filter change, so narrowing the list can never
  // strand the reader on a page that no longer exists.
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const shown = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  function changeFilter(next: string[], set: (v: string[]) => void) {
    set(next);
    setPage(0);
  }

  return (
    <div>
      <div className="mt-4 flex flex-wrap gap-2">
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
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
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
              onClick={() => setPage(i)}
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
