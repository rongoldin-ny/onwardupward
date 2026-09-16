"use client";

import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { claimCoach } from "@/app/actions/claims";
import CoachBookLink from "@/components/CoachBookLink";
import { MatchReason } from "@/components/MatchReason";
import { DisciplineChips, MenteeChips, SpecialtyChips } from "@/components/CoachFormFields";
import { TextArea, TextField } from "@/components/fields";
import { Cta, Tag } from "@/components/ui";
import { coachLevels, disciplineLabel, type CoachDiscipline } from "@/lib/coach-shared";
import type { CoachMatch } from "@/lib/coach-match";
import type { CoachReview } from "@/lib/coach-reviews-db";
import type { ProfileView } from "@/lib/profile-view";
import { labelForRoleType } from "@/lib/taxonomy";
import { CardSection as Section, useEdit, type Viewer } from "./edit-context";
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
  /** Streams in from the server for members; resolves null when this coach isn't one of their matches. */
  topMatch?: Promise<CoachMatch | null> | null;
  hasPendingClaim?: boolean;
  reviews?: CoachReview[];
  ownReview?: CoachReview | null;
}) {
  const { editing, viewer, scheduleSave } = useEdit();
  const coach = view.coach;
  const [discipline, setDiscipline] = useState<CoachDiscipline | null>(coach?.disciplines ?? null);
  const [mentees, setMentees] = useState<string[]>(coach?.target_mentees ?? []);
  const [specialties, setSpecialties] = useState<string[]>(coach?.specialties ?? []);
  const [match, setMatch] = useState<CoachMatch | null>(null);
  useEffect(() => {
    let live = true;
    topMatch?.then((m) => {
      if (live) setMatch(m);
    });
    return () => {
      live = false;
    };
  }, [topMatch]);

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
          {editing ? (
            <TextField
              name="title"
              placeholder={autoSubtitle || "Your coaching"}
              defaultValue={coach?.title ?? ""}
              className="!h-auto !py-2.5 text-[18px] font-black tracking-[-0.02em]"
            />
          ) : (
            <h2 className="text-[22px] leading-[1.15] font-black tracking-[-0.02em] text-cream">
              {subtitle || `Coaching with ${view.firstName}`}
            </h2>
          )}
        </div>
        <span
          className={`eyebrow shrink-0 rounded-full border px-3 py-1.5 ${
            approved ? "border-success/35 text-success" : "border-border-2 text-muted"
          }`}
        >
          {isDraft ? "Draft" : status === "pending" ? "Under review" : approved ? "Live" : "Unclaimed"}
        </span>
      </div>

      {/* Unclaimed listings: "This you?" is the page's main call to action,
          so it leads the card instead of trailing the whole listing. */}
      {!editing && coach && status === "unclaimed" && viewer !== "owner" && (
        <div className="mt-5">
          <CoachClaimCta
            coach={coach}
            viewer={viewer}
            hasPendingClaim={hasPendingClaim}
            label="This you? Claim your profile"
          />
        </div>
      )}

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
            <Section title="Coaching credentials">
              <div className="space-y-3">
                <TextField
                  name="years_coaching"
                  type="number"
                  min={0}
                  max={60}
                  placeholder="Years of coaching experience"
                  defaultValue={coach?.years_coaching ?? ""}
                />
                <TextArea
                  name="credentials"
                  rows={3}
                  placeholder="Certifications, training, or other credentials (optional)"
                  defaultValue={coach?.credentials ?? ""}
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
            <Section title="Pricing">
              <TextField
                name="pricing"
                placeholder="Pricing — a number or a range is fine"
                defaultValue={coach?.pricing ?? ""}
              />
            </Section>
            <Section title="Booking or contact link">
              <div className="space-y-3">
                <TextField
                  name="booking_url"
                  placeholder="Calendly, website, or email"
                  defaultValue={bookingDisplay}
                />
                <p className="px-1 text-[12px] text-muted">
                  Links, ex. Calendly or your website — or just an email address to book you.
                </p>
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
            {coach && (coach.specialties.length > 0 || levels.length > 0) && (
              <div className="flex flex-wrap gap-2.5">
                {coach.specialties.length > 0
                  ? coach.specialties.map((s) => (
                      <Tag key={s} variant="neutral">
                        {labelForRoleType(s)}
                      </Tag>
                    ))
                  : disciplineLabel(coach.disciplines) && (
                      <Tag variant="neutral">{disciplineLabel(coach.disciplines)}</Tag>
                    )}
                {levels.map((l) => (
                  <Tag key={l} variant="neutral">
                    {l}
                  </Tag>
                ))}
              </div>
            )}
            {(coach?.years_coaching || coach?.credentials) && (
              <Section title="Coaching credentials">
                <p className="text-[15px] leading-[1.6] text-body">
                  {coach?.years_coaching
                    ? `${coach.years_coaching} ${coach.years_coaching === 1 ? "year" : "years"} of coaching experience`
                    : null}
                  {coach?.years_coaching && coach?.credentials ? " — " : null}
                  {coach?.credentials}
                </p>
              </Section>
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
            {viewer !== "owner" && match && (
              <MatchReason match={match} textClassName="text-[13px]" />
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

      {!editing && viewer !== "owner" && approved && coach?.booking_url && (
        <div className="mt-8">
          <CoachBookLink
            coachId={coach.id}
            coachName={coach.full_name}
            href={coach.booking_url}
            className="gold-gradient cta-glow block rounded-full px-6 py-4 text-center text-[15px] font-bold text-on-gold"
          >
            Book a session
          </CoachBookLink>
        </div>
      )}
    </div>
  );
}

/** Every "This you?" claim button: solid gold, dark on-gold text. */
const claimButtonClass =
  "gold-gradient cta-glow block w-full rounded-full px-6 py-4 text-center text-[15px] font-bold text-on-gold";

/**
 * "This you?" for unclaimed listings — a pending notice, a member claim
 * button, or a sign-up link for signed-out visitors. Null for anything else.
 */
export function CoachClaimCta({
  coach,
  viewer,
  hasPendingClaim,
  label,
}: {
  coach: NonNullable<ProfileView["coach"]>;
  viewer: Viewer;
  hasPendingClaim: boolean;
  /** Overrides the default per-viewer CTA copy. */
  label?: string;
}) {
  if (coach.status !== "unclaimed" || viewer === "owner") return null;
  if (hasPendingClaim) {
    return (
      <p className="rounded-full border border-border-2 px-6 py-4 text-center text-[15px] font-bold text-secondary">
        Claim pending review
      </p>
    );
  }
  if (viewer === "member") {
    return (
      // A <form> here would nest inside ProfilePage's own outer <form>
      // (the autosave form) — browsers don't allow nested forms and
      // reassociate the submit button with the outer one instead, so
      // this calls the server action directly from a plain button.
      <button
        type="button"
        onClick={() => void claimCoach(coach.id)}
        className={claimButtonClass}
      >
        {label ?? "This you? Claim your slot"}
      </button>
    );
  }
  return (
    <>
      <a
        href={`/claim/${coach.id}`}
        className={claimButtonClass}
      >
        {label ?? "This you? Claim your listing"}
      </a>
      <p className="mt-3 text-center text-[12.5px] leading-[1.5] text-secondary">
        Create an account and this page becomes yours to edit.{" "}
        <a href={`/signin?next=${encodeURIComponent(`/coaches/${coach.id}`)}`}>Already a member?</a>
      </p>
    </>
  );
}
