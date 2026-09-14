"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowLeft } from "lucide-react";
import { importFromLinks, finishOnboarding } from "@/app/actions/onboarding";
import { Cta, PageFrame } from "@/components/ui";
import { CAREER_STAGES, COUNTRIES, ROLE_TYPES, SelectField, TextField } from "@/components/fields";
import type { Profile, ReferenceRow, WorkHistoryRow } from "@/lib/db";

const STEPS = [
  { title: "Start with your links.", subtitle: "We'll pull in what we can from your portfolio, résumé, or LinkedIn.", required: true },
  { title: "A little more about you.", subtitle: "Optional — you can finish this from your profile any time.", required: false },
];

type Props = {
  profile: Profile;
  work: WorkHistoryRow[];
  references: ReferenceRow[];
  exitHref?: string;
  communitySkills?: string[];
};

export default function CandidateWizard({ profile, exitHref = "/role" }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [profileData, setProfileData] = useState(profile);
  const [importedNote, setImportedNote] = useState<string | null>(null);

  function submitStep(form: HTMLFormElement | null, index: number) {
    if (!form) return;
    const formData = new FormData(form);
    setError(null);
    startTransition(async () => {
      if (index === 0) {
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
        return;
      }
      await finishOnboarding(formData); // redirects
    });
  }

  const formRef = useRef<HTMLFormElement>(null);
  const skip = () => { setError(null); startTransition(() => finishOnboarding(new FormData())); };
  const back = () => (step === 0 ? router.push(exitHref) : (setError(null), setStep(step - 1)));

  return (
    <PageFrame size="narrow">
    <div className="flex flex-1 flex-col px-7 pt-7 pb-8">
      <header>
        <div className="relative flex items-center justify-center">
          <button type="button" onClick={back} aria-label="Back" className="absolute left-0 text-cream">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <p className="eyebrow text-secondary">Step {step + 1} of {STEPS.length}</p>
        </div>
        <div className="mt-5 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-[3px] flex-1 rounded-full ${i <= step ? "gold-gradient" : "bg-border-1"}`}
            />
          ))}
        </div>
      </header>

      <main className="mt-10 flex-1">
        <h1 className="text-[34px] leading-[1.08] font-black tracking-[-0.02em] text-cream">
          {STEPS[step].title}
        </h1>
        <p className="mt-3 text-[17px] text-secondary">{STEPS[step].subtitle}</p>

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
          {step === 0 && <StepLinks profile={profileData} />}
          {step === 1 && <StepProfileSetup profile={profileData} />}

          {error && <p className="mt-4 text-[14px] text-gold">{error}</p>}

          <div className="mt-10">
            <Cta type="submit" disabled={pending}>
              {pending
                ? step === 0
                  ? "Reading your portfolio…"
                  : "Saving…"
                : step === STEPS.length - 1
                  ? "Finish"
                  : "Continue"}
            </Cta>
            {!STEPS[step].required && (
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

function StepLinks({ profile }: { profile: Profile }) {
  return (
    <div className="space-y-4">
      <TextField
        name="linkedin_url"
        placeholder="linkedin.com/in/…"
        defaultValue={profile.linkedin_url ?? ""}
      />
      <TextField
        name="portfolio_url"
        placeholder="Your portfolio URL"
        defaultValue={profile.portfolio_url ?? ""}
      />
      <TextField
        name="portfolio_password"
        placeholder="Portfolio password, if it has one"
        defaultValue={profile.portfolio_password ?? ""}
      />
      <label className="flex h-[58px] w-full cursor-pointer items-center justify-between rounded-full border border-border-1 bg-surface-2 px-6 text-[15px] text-muted">
        <span data-resume-label>
          {profile.resume_url ? "Résumé on file — tap to replace" : "Upload your résumé (PDF)"}
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
  );
}

function StepProfileSetup({ profile }: { profile: Profile }) {
  const [outreach, setOutreach] = useState(profile.open_to_coaching_outreach ?? false);
  return (
    <div className="space-y-4">
      <SelectField
        name="career_stage"
        placeholder="Career stage"
        options={CAREER_STAGES}
        defaultValue={profile.career_stage ?? ""}
      />
      <SelectField
        name="role_type"
        placeholder="Type of work"
        options={ROLE_TYPES}
        defaultValue={profile.role_type ?? ""}
      />
      <SelectField
        name="country"
        placeholder="Country"
        options={COUNTRIES}
        defaultValue={profile.location_country ?? ""}
      />
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
    </div>
  );
}
