"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, MessageSquare } from "lucide-react";
import { submitCoachReview } from "@/app/actions/reviews";
import { TextArea, TextField } from "@/components/fields";
import { Avatar, Cta, Eyebrow } from "@/components/ui";
import type { CoachReview } from "@/lib/coach-reviews-db";

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 3600 * 1000));
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function ReviewForm({
  coachId,
  existing,
  onSaved,
  onCancel,
}: {
  coachId: string;
  existing: CoachReview | null;
  onSaved: (review: CoachReview) => void;
  onCancel: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!formRef.current) return;
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(formRef.current);
      const result = await submitCoachReview(coachId, formData);
      if (result.error || !result.review) {
        setError(result.error ?? "Couldn't save your review — try again.");
        return;
      }
      onSaved(result.review);
    } catch (err) {
      // Next's own redirect()/notFound() control-flow "errors" carry this
      // digest — let those propagate so Next can still act on them.
      if (err && typeof err === "object" && "digest" in err && typeof err.digest === "string" && err.digest.startsWith("NEXT_REDIRECT")) {
        throw err;
      }
      console.error("submitCoachReview threw:", err);
      setError("Something went wrong — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="space-y-3 rounded-[16px] border border-border-1 bg-surface-1 p-4"
    >
      <div>
        <p className="mb-2 text-[12.5px] font-bold text-secondary">What did you get help with?</p>
        <TextField
          name="helped_with"
          placeholder="e.g. Portfolio review, leveling up to manager…"
          defaultValue={existing?.helpedWith ?? ""}
          required
        />
      </div>
      <div>
        <p className="mb-2 text-[12.5px] font-bold text-secondary">What was the outcome?</p>
        <TextField
          name="outcome"
          placeholder="e.g. Landed a senior role within 3 months"
          defaultValue={existing?.outcome ?? ""}
          required
        />
      </div>
      <div>
        <p className="mb-2 text-[12.5px] font-bold text-secondary">Anything else about your experience?</p>
        <TextArea
          name="comments"
          rows={3}
          placeholder="Optional — share more detail"
          defaultValue={existing?.comments ?? ""}
        />
      </div>
      {error && <p className="text-[12.5px] text-gold">{error}</p>}
      <div className="flex gap-2">
        <Cta type="submit" disabled={submitting} className="!h-[42px] flex-1 text-[13.5px]">
          {submitting ? "Saving…" : existing ? "Update review" : "Post review"}
        </Cta>
        <button
          type="button"
          onClick={onCancel}
          className="h-[42px] rounded-full px-4 text-[13.5px] text-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function CoachReviews({
  coachId,
  reviews,
  ownReview = null,
  canReview,
  signInHref,
}: {
  coachId: string;
  reviews: CoachReview[];
  ownReview?: CoachReview | null;
  /** True for any signed-in member who isn't the coach viewing their own card. */
  canReview: boolean;
  /** Set when the viewer isn't signed in — the write button links here instead. */
  signInHref?: string;
}) {
  const router = useRouter();
  const [list, setList] = useState(reviews);
  const [own, setOwn] = useState(ownReview);
  const [writing, setWriting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Re-sync if the server sends fresh props (e.g. navigating to a different
  // coach) — adjusted during render per React's guidance, not via an effect,
  // so a local post doesn't get clobbered by a stale re-render in between.
  const [prevReviews, setPrevReviews] = useState(reviews);
  if (reviews !== prevReviews) {
    setPrevReviews(reviews);
    setList(reviews);
  }
  const [prevOwnReview, setPrevOwnReview] = useState(ownReview);
  if (ownReview !== prevOwnReview) {
    setPrevOwnReview(ownReview);
    setOwn(ownReview);
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  function handleSaved(review: CoachReview) {
    setList((cur) => [review, ...cur.filter((r) => r.id !== review.id)]);
    setToast(own ? "Review updated" : "Review posted");
    setOwn(review);
    setWriting(false);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <Eyebrow className="text-muted">Reviews</Eyebrow>
        {toast && (
          <span className="eyebrow flex items-center gap-1.5 text-success">
            <Check size={12} strokeWidth={2} />
            {toast}
          </span>
        )}
      </div>

      {writing ? (
        <div className="mt-3">
          <ReviewForm
            coachId={coachId}
            existing={own}
            onSaved={handleSaved}
            onCancel={() => setWriting(false)}
          />
        </div>
      ) : (
        <>
          {list.length === 0 ? (
            <div className="mt-3 flex flex-col items-center gap-3 rounded-[16px] border border-dashed border-border-2 px-5 py-6 text-center">
              <MessageSquare size={20} strokeWidth={1.5} className="text-muted" />
              <p className="text-[13px] text-secondary">No reviews yet.</p>
              {canReview && (
                <button
                  type="button"
                  onClick={() => setWriting(true)}
                  className="text-[13px] font-bold text-gold"
                >
                  Write a review
                </button>
              )}
              {!canReview && signInHref && (
                <a href={signInHref} className="text-[13px] font-bold text-gold">
                  Sign in to write a review
                </a>
              )}
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {list.map((r) => (
                <div key={r.id} className="rounded-[16px] border border-border-1 bg-surface-1 p-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar id={r.reviewerId} src={r.reviewerPhoto} size={28} />
                    <p className="min-w-0 flex-1 truncate text-[13px] font-bold text-cream">
                      {r.reviewerName}
                    </p>
                    <span className="shrink-0 text-[11.5px] text-muted">{timeAgo(r.createdAt)}</span>
                  </div>
                  <p className="mt-3 text-[13px] leading-[1.5] text-body">
                    <span className="font-bold text-gold">Got help with:</span> {r.helpedWith}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-[1.5] text-body">
                    <span className="font-bold text-gold">Outcome:</span> {r.outcome}
                  </p>
                  {r.comments && (
                    <p className="mt-2 text-[13px] leading-[1.5] text-body-2">{r.comments}</p>
                  )}
                </div>
              ))}
              {canReview && (
                <button
                  type="button"
                  onClick={() => setWriting(true)}
                  className="text-[13px] font-bold text-gold"
                >
                  {own ? "Edit your review" : "Write a review"}
                </button>
              )}
              {!canReview && signInHref && (
                <a href={signInHref} className="block text-[13px] font-bold text-gold">
                  Sign in to write a review
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
