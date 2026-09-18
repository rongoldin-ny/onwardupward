"use client";

import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { claimCoach } from "@/app/actions/claims";
import CoachBookLink from "@/components/CoachBookLink";
import CoachRequestForm from "@/components/CoachRequestForm";
import { MatchReason } from "@/components/MatchReason";
import {
  CertificationChips,
  DisciplineChips,
  MenteeChips,
  SpecialtyChips,
} from "@/components/CoachFormFields";
import CertificationInfo from "@/components/CertificationInfo";
import { TextArea, TextField } from "@/components/fields";
import { Cta, Tag } from "@/components/ui";
import {
  certificationLabels,
  pricingNotes,
  coachLevels,
  coachMissing,
  disciplineLabel,
  type CoachDiscipline,
} from "@/lib/coach-shared";
import type { CoachMatch } from "@/lib/coach-match";
import type { CoachReview } from "@/lib/coach-reviews-db";
import type { ProfileView } from "@/lib/profile-view";
import { labelForSpecialty } from "@/lib/taxonomy";
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
  const [certifications, setCertifications] = useState<string[]>(coach?.certifications ?? []);
  const [certOther, setCertOther] = useState(coach?.certification_other ?? "");
  const [freeIntro, setFreeIntro] = useState(!!coach?.free_intro_call);
  const [pricingOnCall, setPricingOnCall] = useState(!!coach?.pricing_on_call);
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
  const missing = coach ? coachMissing(coach) : [];
  const canSubmit = missing.length === 0;
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
            <>
              <TextField
                name="title"
                placeholder={autoSubtitle || "Your coaching"}
                defaultValue={coach?.title ?? ""}
                className="!h-auto !py-2.5 text-[18px] font-black tracking-[-0.02em]"
              />
              <p className="mt-2 px-1 text-[12px] text-muted">Your headline.</p>
            </>
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
          {isDraft
            ? "Draft"
            : status === "pending"
              ? "Under review"
              : approved
                ? "Claimed"
                : "Unclaimed"}
        </span>
      </div>

      {editing && (
        <div className="mt-3">
          <TextField
            name="company"
            placeholder="Company or practice (optional)"
            defaultValue={coach?.company ?? ""}
          />
        </div>
      )}

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
              </div>
            </Section>
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
            <Section title="Newsletter">
              <div className="space-y-3">
                <TextField
                  name="substack_url"
                  placeholder="Your Substack or newsletter link (optional)"
                  defaultValue={coach?.substack_url ?? ""}
                />
                <p className="px-1 text-[12px] text-muted">
                  Your articles may be featured in our Reads section.
                </p>
              </div>
            </Section>
            <Section title="Coaching credentials">
              <div className="space-y-5">
                <CertificationChips
                  value={certifications}
                  other={certOther}
                  onChange={(c) => {
                    setCertifications(c);
                    scheduleSave();
                  }}
                  onOther={(o) => {
                    setCertOther(o);
                    scheduleSave();
                  }}
                />
                <TextArea
                  name="credentials"
                  rows={3}
                  placeholder="Any additional credentials or training (optional)"
                  defaultValue={coach?.credentials ?? ""}
                />
              </div>
            </Section>
            <Section title="Pricing">
              <div className="space-y-3">
                <TextField
                  name="pricing"
                  placeholder="Pricing — a number or a range is fine"
                  defaultValue={coach?.pricing ?? ""}
                />
                <PricingCheck
                  name="free_intro_call"
                  label="Free introductory call"
                  checked={freeIntro}
                  onChange={(v) => {
                    setFreeIntro(v);
                    scheduleSave();
                  }}
                />
                <PricingCheck
                  name="pricing_on_call"
                  label="Pricing discussed on the call"
                  checked={pricingOnCall}
                  onChange={(v) => {
                    setPricingOnCall(v);
                    scheduleSave();
                  }}
                />
              </div>
            </Section>
          </>
        ) : (
          <>
            {/* Four different claims, so four rows: what they're certified as,
                the discipline they coach in, the practice they specialize in,
                and who they take. Stacked as one row of unlabelled chips they
                read as one list. */}
            {coach && certificationLabels(coach).length > 0 && (
              <Section title="Certification" pill={<CertificationInfo />}>
                <ChipRow items={certificationLabels(coach)} />
              </Section>
            )}
            {coach && disciplineLabel(coach.disciplines) && (
              <Section title="Discipline">
                <ChipRow items={[disciplineLabel(coach.disciplines)]} />
              </Section>
            )}
            {coach && coach.specialties.length > 0 && (
              <Section title="Specializes in">
                <ChipRow items={coach.specialties.map(labelForSpecialty)} />
              </Section>
            )}
            {levels.length > 0 && (
              <Section title="Works with">
                <ChipRow items={levels} />
              </Section>
            )}
            {coach?.credentials && (
              <Section title="Coaching credentials">
                <p className="text-[15px] leading-[1.6] text-body">{coach.credentials}</p>
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
            {coach && (coach.pricing || pricingNotes(coach).length > 0) && (
              <Section title="Pricing">
                {coach.pricing && (
                  <p className="text-[15px] leading-[1.6] text-body">{coach.pricing}</p>
                )}
                {pricingNotes(coach).length > 0 && (
                  <div className={`flex flex-wrap gap-2.5 ${coach.pricing ? "mt-3" : ""}`}>
                    <ChipRow items={pricingNotes(coach)} />
                  </div>
                )}
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
              {`Add ${missing.map((m) => m.toLowerCase()).join(", ")} to submit.`}
            </p>
          )}
        </div>
      )}

    </div>
  );
}

/** A labelled checkbox that posts nothing when unticked, like any checkbox. */
function PricingCheck({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-border-1 bg-surface-1 p-4">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[#E8C987]"
      />
      <span className="text-[13px] leading-[1.5] text-body-2">{label}</span>
    </label>
  );
}

/** A row of neutral chips — the read-mode counterpart of the chip pickers. */
function ChipRow({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {items.map((item) => (
        <Tag key={item} variant="neutral">
          {item}
        </Tag>
      ))}
    </div>
  );
}

/**
 * "Connect with <first name>" for live listings, shown under the profile
 * links. Claimed coaches are reached through the platform (signed-out
 * visitors sign in first); curated seeds only have their own booking link.
 */
export function CoachConnect({
  coach,
  viewer,
}: {
  coach: NonNullable<ProfileView["coach"]>;
  viewer: Viewer;
}) {
  if (viewer === "owner" || coach.status !== "approved") return null;
  const label = `Connect with ${(coach.full_name || "this coach").split(" ")[0]}`;
  if (coach.profile_id && viewer === "member") {
    return <CoachRequestForm coachId={coach.id} coachName={coach.full_name} label={label} />;
  }
  if (coach.profile_id && viewer === "public") {
    return (
      <a href={`/signin?next=${encodeURIComponent(`/coaches/${coach.id}`)}`} className={claimButtonClass}>
        {label}
      </a>
    );
  }
  if (coach.booking_url) {
    return (
      <CoachBookLink
        coachId={coach.id}
        coachName={coach.full_name}
        href={coach.booking_url}
        className={claimButtonClass}
      >
        {label}
      </CoachBookLink>
    );
  }
  return null;
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
