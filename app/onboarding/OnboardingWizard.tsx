"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowLeft } from "lucide-react";
import { saveCoachAttributes } from "@/app/actions/coaches";
import { importFromLinks, finishOnboarding } from "@/app/actions/onboarding";
import { DisciplineChips, MenteeChips } from "@/components/CoachFormFields";
import { Cta, PageFrame } from "@/components/ui";
import {
  CAREER_STAGES,
  COUNTRIES,
  ROLE_TYPES,
  SelectField,
  TextArea,
  TextField,
} from "@/components/fields";
import type { CoachDiscipline } from "@/lib/coach-shared";
import type { Profile } from "@/lib/db";

const BASE_STEPS = [
  { title: "Start with your links.", subtitle: "We'll pull in what we can from your portfolio, résumé, or LinkedIn.", required: true },
  { title: "A little more about you.", subtitle: "Optional — you can finish this from your profile any time.", required: false },
];
const COACH_STEP = {
  title: "Your coaching.",
  subtitle: "What you offer and who you coach — refine it on your profile any time.",
  required: false,
};

type Props = {
  profile: Profile;
  exitHref?: string;
};

/**
 * Every role shares the same short signup; coaches get one extra step for
 * their coaching attributes. All fields live in one form the whole time so
 * the final save carries everything, whichever step it's submitted from.
 */
export default function OnboardingWizard({ profile, exitHref = "/role" }: Props) {
  const router = useRouter();
  const isCoach = profile.role === "coach";
  const steps = isCoach ? [...BASE_STEPS, COACH_STEP] : BASE_STEPS;
  const lastStep = steps.length - 1;

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [profileData, setProfileData] = useState(profile);
  const [importedNote, setImportedNote] = useState<string | null>(null);
  const [outreach, setOutreach] = useState(profile.open_to_coaching_outreach ?? false);
  const [discipline, setDiscipline] = useState<CoachDiscipline | null>(null);
  const [mentees, setMentees] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  function finish(formData: FormData, withCoach: boolean) {
    startTransition(async () => {
      if (withCoach) {
        const result = await saveCoachAttributes(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
      }
      await finishOnboarding(formData); // redirects
    });
  }

  function submitStep(form: HTMLFormElement | null, index: number) {
    if (!form) return;
    const formData = new FormData(form);
    setError(null);
    if (index === 0) {
      startTransition(async () => {
        const result = await importFromLinks(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        if (result.profile) setProfileData(result.profile);
        setImportedNote(
          result.found.length > 0
            ? `From your portfolio we pre-filled: ${result.found.join(", ")}. Check it over — everything can be edited.`
            : null,
        );
        setStep(1);
      });
      return;
    }
    if (index < lastStep) {
      setStep(index + 1);
      return;
    }
    finish(formData, isCoach);
  }

  const skip = () => {
    setError(null);
    if (step < lastStep) {
      setStep(step + 1);
      return;
    }
    finish(new FormData(formRef.current ?? undefined), false);
  };
  const back = () => (step === 0 ? router.push(exitHref) : (setError(null), setStep(step - 1)));

  const p = profileData;

  return (
    <PageFrame size="narrow">
    <div className="flex flex-1 flex-col px-7 pt-7 pb-8">
      <header>
        <div className="relative flex items-center justify-center">
          <button type="button" onClick={back} aria-label="Back" className="absolute left-0 text-cream">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <p className="eyebrow text-secondary">Step {step + 1} of {steps.length}</p>
        </div>
        <div className="mt-5 flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-[3px] flex-1 rounded-full ${i <= step ? "gold-gradient" : "bg-border-1"}`}
            />
          ))}
        </div>
      </header>

      <main className="mt-10 flex-1">
        <h1 className="text-[34px] leading-[1.08] font-black tracking-[-0.02em] text-cream">
          {steps[step].title}
        </h1>
        <p className="mt-3 text-[17px] text-secondary">{steps[step].subtitle}</p>

        {importedNote && step === 1 && (
          <div className="mt-6 rounded-[16px] border border-gold-border bg-gold-tint px-5 py-4 text-[13px] leading-[1.5] text-gold">
            {importedNote}
          </div>
        )}

        <form
          ref={formRef}
          className="mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            submitStep(e.currentTarget, step);
          }}
        >
          <div className={step === 0 ? "space-y-4" : "hidden"}>
            <TextField
              name="linkedin_url"
              placeholder="linkedin.com/in/…"
              defaultValue={p.linkedin_url ?? ""}
            />
            <TextField
              name="portfolio_url"
              placeholder="Your portfolio URL"
              defaultValue={p.portfolio_url ?? ""}
            />
            <TextField
              name="portfolio_password"
              placeholder="Portfolio password, if it has one"
              defaultValue={p.portfolio_password ?? ""}
            />
            <label className="flex h-[58px] w-full cursor-pointer items-center justify-between rounded-full border border-border-1 bg-surface-2 px-6 text-[15px] text-muted">
              <span data-resume-label>
                {p.resume_url ? "Résumé on file — tap to replace" : "Upload your résumé (PDF)"}
              </span>
              <input
                type="file"
                name="resume"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const label = e.currentTarget
                    .closest("label")
                    ?.querySelector("[data-resume-label]");
                  const f = e.currentTarget.files?.[0];
                  if (label && f) label.textContent = f.name;
                }}
              />
              <span className="text-[13px] font-bold text-gold">Browse</span>
            </label>
            <p className="pt-1 text-[13px] leading-[1.5] text-secondary">
              Add at least one of LinkedIn, your résumé, or your portfolio and
              we&apos;ll pull in your name, bio, roles, experience, and location —
              you review everything before it goes live. If your portfolio is
              password-protected, the password lets us read it too.
            </p>
          </div>

          <div key={`about-${p.updated_at}`} className={step === 1 ? "space-y-4" : "hidden"}>
            <SelectField
              name="career_stage"
              placeholder="Career stage"
              options={CAREER_STAGES}
              defaultValue={p.career_stage ?? ""}
            />
            <SelectField
              name="role_type"
              placeholder="Type of work"
              options={ROLE_TYPES}
              defaultValue={p.role_type ?? ""}
            />
            <SelectField
              name="country"
              placeholder="Country"
              options={COUNTRIES}
              defaultValue={p.location_country ?? ""}
            />
            {!isCoach && (
              <label className="flex cursor-pointer items-start gap-3 rounded-[20px] border border-border-1 bg-surface-2 p-5">
                <input
                  type="checkbox"
                  name="open_to_coaching_outreach"
                  checked={outreach}
                  onChange={(e) => setOutreach(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#E8C987]"
                />
                <span className="text-[14px] leading-[1.5] text-secondary">
                  It&apos;s okay for people to reach out to me for coaching opportunities.
                </span>
              </label>
            )}
          </div>

          {isCoach && (
            <div className={step === 2 ? "space-y-5" : "hidden"}>
              <TextArea
                name="offering"
                rows={3}
                placeholder="Your offering — what a session with you covers"
              />
              <DisciplineChips value={discipline} onChange={setDiscipline} />
              <MenteeChips value={mentees} onChange={setMentees} />
              <TextField name="best_for" placeholder="Best for — one line on who gets the most from you" />
              <TextField name="booking_url" placeholder="Booking link — Calendly, website, or an email address" />
              <TextField name="pricing" placeholder="Pricing — a number or a range is fine (optional)" />
            </div>
          )}

          {error && <p className="mt-4 text-[14px] text-gold">{error}</p>}

          <div className="mt-10">
            <Cta type="submit" disabled={pending}>
              {pending
                ? step === 0
                  ? "Reading your portfolio…"
                  : "Saving…"
                : step === lastStep
                  ? "Finish"
                  : "Continue"}
            </Cta>
            {!steps[step].required && (
              <button
                type="button"
                onClick={skip}
                className="mt-5 block w-full text-center text-[15px] text-secondary"
              >
                Do this later
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
    </PageFrame>
  );
}
