"use client";

import { useState } from "react";
import { GraduationCap, Sparkles } from "lucide-react";
import { claimCoach } from "@/app/actions/claims";
import CoachBookLink from "@/components/CoachBookLink";
import { DisciplineChips, MenteeChips, SpecialtyChips } from "@/components/CoachFormFields";
import { TextArea, TextField } from "@/components/fields";
import { Cta, Eyebrow, Tag } from "@/components/ui";
import { coachLevels, disciplineLabel, type CoachDiscipline } from "@/lib/coach-shared";
import type { CoachReview } from "@/lib/coach-reviews-db";
import type { ProfileView } from "@/lib/profile-view";
import { labelForRoleType } from "@/lib/taxonomy";
import { CardSection as Section, useEdit } from "./edit-context";
import CoachReviews from "./CoachReviews";

/** The back of the card — coaching attributes. */
export default function CoachCard({
  view,
  coachingEnabled,
  onStartCoaching,
  onSubmitApplication,
  submitting = false,
  topMatch = null,
  hasPendingClaim = false,
  reviews = [],
  ownReview = null,
}: {
  view: ProfileView;
  coachingEnabled: boolean;
  onStartCoaching: () => void;
  onSubmitApplication?: () => void;
  submitting?: boolean;
  topMatch?: { isTopMatch: boolean; reason: string | null } | null;
  hasPendingClaim?: boolean;
  reviews?: CoachReview[];
  ownReview?: CoachReview | null;
}) {
  const { editing, viewer, scheduleSave } = useEdit();
  const coach = view.coach;
  const [discipline, setDiscipline] = useState<CoachDiscipline | null>(coach?.disciplines ?? null);
  const [mentees, setMentees] = useState<string[]>(coach?.target_mentees ?? []);
  const [specialties, setSpecialties] = useState<string[]>(coach?.specialties ?? []);

  const shell = "overflow-hidden rounded-[24px] border border-border-1 bg-surface-2 p-6";

  if (!coach && !coachingEnabled) {
    return (
      <div className={`${shell} flex min-h-[320px] flex-col items-center justify-center text-center`}>
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold-border text-gold">
          <GraduationCap size={22} strokeWidth={1.5} />
        </span>
        {viewer === "owner" ? (
          <>
            <h2 className="mt-5 text-[22px] font-black tracking-[-0.02em] text-cream">
              Open to coaching?
            </h2>
            <p className="mt-2 max-w-[320px] text-[14px] leading-[1.5] text-secondary">
              Join the coach bench — share what you know with designers and PMs
              from the network, on your terms.
            </p>
            <Cta type="button" onClick={onStartCoaching} className="mt-6 max-w-[240px]">
              Start coaching
            </Cta>
          </>
        ) : (
          <p className="mt-5 text-[15px] text-secondary">
            {`${view.firstName} isn't coaching (yet).`}
          </p>
        )}
      </div>
    );
  }

  const status = coach?.status ?? "draft";
  const approved = status === "approved";
  const isDraft = status === "draft";
  const canSubmit = !!coach?.offering && !!coach?.booking_url;
  const levels = coach ? coachLevels(coach) : [];
  const autoSubtitle = coach
    ? [coach.company, disciplineLabel(coach.disciplines)].filter(Boolean).join(" · ")
    : "";
  const subtitle = coach?.title || autoSubtitle;
  const bookingDisplay = (coach?.booking_url ?? "").replace(/^mailto:/, "");

  return (
    <div className={shell}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Eyebrow className="text-gold">Coach card</Eyebrow>
          {editing ? (
            <TextField
              name="title"
              placeholder={autoSubtitle || "Your coaching"}
              defaultValue={coach?.title ?? ""}
              className="mt-2 !h-auto !py-2.5 text-[18px] font-black tracking-[-0.02em]"
            />
          ) : (
            <h2 className="mt-2 text-[22px] leading-[1.15] font-black tracking-[-0.02em] text-cream">
              {subtitle || `Coaching with ${view.firstName}`}
            </h2>
          )}
        </div>
        <span
          className={`eyebrow shrink-0 rounded-full border px-3 py-1.5 ${
            approved ? "border-gold-border text-gold" : "border-border-2 text-muted"
          }`}
        >
          {isDraft ? "Draft" : status === "pending" ? "Under review" : approved ? "Live" : "Unclaimed"}
        </span>
      </div>

      {viewer === "owner" && (
        <p className="mt-3 text-[12.5px] leading-[1.5] text-secondary">
          {isDraft
            ? "Saved as a draft as you type — nobody sees it until you submit it for review."
            : status === "pending"
              ? "Under review — you'll get an email the moment you're approved. Edits save to your application."
              : "Edits go live immediately."}
        </p>
      )}

      <div className="mt-6 space-y-6">
        {editing ? (
          <>
            <Section title="Disciplines & levels">
              <div className="space-y-5">
                <DisciplineChips
                  value={discipline}
                  onChange={(d) => {
                    setDiscipline(d);
                    scheduleSave();
                  }}
                />
                <MenteeChips
                  value={mentees}
                  onChange={(m) => {
                    setMentees(m);
                    scheduleSave();
                  }}
                />
                <SpecialtyChips
                  value={specialties}
                  onChange={(s) => {
                    setSpecialties(s);
                    scheduleSave();
                  }}
                />
              </div>
            </Section>
            <Section title="The offering">
              <TextArea
                name="offering"
                rows={4}
                placeholder="What a session with you covers"
                defaultValue={coach?.offering ?? ""}
              />
            </Section>
            <Section title="Best for">
              <TextField
                name="best_for"
                placeholder="One line on who gets the most from you"
                defaultValue={coach?.best_for ?? ""}
              />
            </Section>
            <Section title="Booking & pricing">
              <div className="space-y-3">
                <TextField
                  name="booking_url"
                  placeholder="Booking link — Calendly, website, or an email address"
                  defaultValue={bookingDisplay}
                />
                <TextField
                  name="pricing"
                  placeholder="Pricing — a number or a range is fine"
                  defaultValue={coach?.pricing ?? ""}
                />
                <TextField
                  name="company"
                  placeholder="Company or practice (optional)"
                  defaultValue={coach?.company ?? ""}
                />
              </div>
            </Section>
            <Section title="Newsletter">
              <TextField
                name="substack_url"
                placeholder="Your Substack or newsletter link (optional)"
                defaultValue={coach?.substack_url ?? ""}
              />
            </Section>
          </>
        ) : (
          <>
            {coach && coach.specialties.length > 0 && (
              <div>
                <Eyebrow className="text-muted">Specializes in</Eyebrow>
                <div className="mt-2.5 flex flex-wrap gap-2.5">
                  {coach.specialties.map((s) => (
                    <Tag key={s}>{labelForRoleType(s)}</Tag>
                  ))}
                </div>
              </div>
            )}
            {levels.length > 0 && (
              <div className="flex flex-wrap gap-2.5">
                {levels.map((l) => (
                  <Tag key={l}>{l}</Tag>
                ))}
              </div>
            )}
            {coach?.offering && (
              <Section title="The offering">
                <p className="text-[15px] leading-[1.6] text-body">{coach.offering}</p>
              </Section>
            )}
            {coach?.best_for && (
              <Section title="Best for">
                <p className="text-[15px] leading-[1.6] text-body">{coach.best_for}</p>
              </Section>
            )}
            {coach?.pricing && (
              <Section title="Pricing">
                <p className="text-[15px] leading-[1.6] text-body">{coach.pricing}</p>
              </Section>
            )}
            {coach?.substack_url && (
              <Section title="Newsletter">
                <a
                  href={coach.substack_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[15px] leading-[1.6] text-gold underline"
                >
                  {coach.substack_url.replace(/^https?:\/\//, "")}
                </a>
              </Section>
            )}
            {!coach?.offering && !coach?.best_for && viewer === "owner" && (
              <p className="text-[14px] text-secondary">
                Tap Edit to describe your offering and how to book you.
              </p>
            )}
            {viewer !== "owner" && topMatch?.isTopMatch && (
              <div className="rounded-[14px] border border-gold-border bg-surface-1 px-4 py-3">
                <span className="eyebrow flex items-center gap-1.5 text-gold">
                  <Sparkles size={12} strokeWidth={1.5} />
                  Top match
                </span>
                {topMatch.reason && (
                  <p className="mt-1.5 text-[13px] leading-[1.5] text-body-2">{topMatch.reason}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {!editing && coach && (
        <div className="mt-8">
          <CoachReviews
            coachId={coach.id}
            reviews={reviews}
            ownReview={ownReview}
            canReview={viewer === "member"}
            signInHref={
              viewer === "public" ? `/signin?next=${encodeURIComponent(`/coaches/${coach.id}`)}` : undefined
            }
          />
        </div>
      )}

      {viewer === "owner" && isDraft && (
        <div className="mt-8">
          <Cta
            type="button"
            onClick={onSubmitApplication}
            disabled={!canSubmit || submitting}
            className="disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit for review"}
          </Cta>
          {!canSubmit && (
            <p className="mt-3 text-center text-[12.5px] text-secondary">
              Add your offering and a booking link to submit.
            </p>
          )}
        </div>
      )}

      {!editing && viewer !== "owner" && coach && (
        <div className="mt-8">
          {approved && coach.booking_url ? (
            <CoachBookLink
              coachId={coach.id}
              coachName={coach.full_name}
              href={coach.booking_url}
              className="gold-gradient cta-glow block rounded-full px-6 py-4 text-center text-[15px] font-bold text-on-gold"
            >
              Book a session
            </CoachBookLink>
          ) : status === "unclaimed" && hasPendingClaim ? (
            <p className="rounded-full border border-border-2 px-6 py-4 text-center text-[15px] font-bold text-secondary">
              Claim pending review
            </p>
          ) : status === "unclaimed" && viewer === "member" ? (
            <form action={claimCoach.bind(null, coach.id)}>
              <button
                type="submit"
                className="block w-full rounded-full border border-border-2 px-6 py-4 text-center text-[15px] font-bold text-cream"
              >
                This you? Claim your slot
              </button>
            </form>
          ) : status === "unclaimed" && viewer === "public" ? (
            <a
              href={`/signin?next=${encodeURIComponent(`/coaches/${coach.id}`)}`}
              className="block rounded-full border border-border-2 px-6 py-4 text-center text-[15px] font-bold text-cream"
            >
              This you? Sign in to claim your slot
            </a>
          ) : null}
        </div>
      )}
    </div>
  );
}
