"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowLeft } from "lucide-react";
import { saveCoachListing } from "@/app/actions/coaches";
import { DisciplineChips, MenteeChips, PhotoPicker } from "@/components/CoachFormFields";
import { TextField, TextArea } from "@/components/fields";
import { Cta, PageFrame } from "@/components/ui";
import { type CoachDiscipline } from "@/lib/coach-shared";

const STEPS = [
  { title: "You, in brief.", subtitle: "Your name, email, and a photo members will recognize." },
  { title: "What you offer.", subtitle: "Your story, and what a session with you covers." },
  { title: "Who you coach.", subtitle: "The disciplines and levels you mentor." },
  { title: "The details.", subtitle: "Best for, how to book you, and pricing." },
];

/**
 * First-time coach onboarding — a progressive wizard around the same
 * `saveCoachListing` action `CoachListingForm` uses for edits. All fields
 * live in one form the whole time; steps just show/hide sections, so no
 * values are lost moving back and forth.
 */
export default function CoachWizard({
  prefill,
  exitHref,
}: {
  prefill: { name: string | null; email: string | null; photoUrl: string | null };
  exitHref: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [mentees, setMentees] = useState<string[]>([]);
  const [discipline, setDiscipline] = useState<CoachDiscipline | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(prefill.photoUrl);
  const formRef = useRef<HTMLFormElement>(null);

  function validateStep(index: number): string | null {
    const fd = new FormData(formRef.current!);
    const str = (k: string) => String(fd.get(k) ?? "").trim();
    if (index === 0) {
      if (!str("full_name")) return "Add your name.";
      if (!/^\S+@\S+\.\S+$/.test(str("email"))) return "That email doesn't look right.";
      if (!photoPreview) return "Add a photo or logo.";
    }
    if (index === 1) {
      if (!str("short_description")) return "Add a short description.";
      if (!str("offering")) return "Describe your offering.";
    }
    if (index === 2) {
      if (!discipline) return "Pick which disciplines you coach for.";
      if (mentees.length === 0) return "Pick at least one group you mentor.";
    }
    if (index === 3) {
      if (!str("best_for")) return "Add a line on who gets the most from you.";
      if (!str("booking_url")) return "Add a booking link — a URL or an email address.";
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep(step + 1);
  }

  function back() {
    setError(null);
    if (step === 0) router.push(exitHref);
    else setStep(step - 1);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const err = validateStep(3);
    if (err) {
      setError(err);
      return;
    }
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await saveCoachListing(formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <PageFrame size="narrow">
      <div className="flex flex-1 flex-col px-7 pt-7 pb-8">
        <header>
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={back}
              aria-label="Back"
              className="absolute left-0 text-cream"
            >
              <ArrowLeft size={20} strokeWidth={1.5} />
            </button>
            <p className="eyebrow text-secondary">
              Step {step + 1} of {STEPS.length}
            </p>
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

          <form ref={formRef} className="mt-8" onSubmit={submit}>
            <div className={step === 0 ? "space-y-4" : "hidden"}>
              <PhotoPicker preview={photoPreview} onPick={setPhotoPreview} />
              <TextField name="full_name" placeholder="Full name" defaultValue={prefill.name ?? ""} />
              <TextField
                name="email"
                type="email"
                placeholder="Email address"
                defaultValue={prefill.email ?? ""}
              />
            </div>

            <div className={step === 1 ? "space-y-4" : "hidden"}>
              <TextArea
                name="short_description"
                rows={3}
                placeholder="Short description — who you are, in a couple of sentences"
              />
              <TextArea
                name="offering"
                rows={3}
                placeholder="Your offering — what a session with you covers"
              />
            </div>

            <div className={step === 2 ? "space-y-5" : "hidden"}>
              <DisciplineChips value={discipline} onChange={setDiscipline} />
              <MenteeChips value={mentees} onChange={setMentees} />
            </div>

            <div className={step === 3 ? "space-y-4" : "hidden"}>
              <TextField name="best_for" placeholder="Best for — one line on who gets the most from you" />
              <TextField name="booking_url" placeholder="Booking link — Calendly, website, or an email address" />
              <TextField name="website" placeholder="Website (optional)" />
              <TextField name="company" placeholder="Company name (optional)" />
              <TextField name="pricing" placeholder="Pricing — a number or a range is fine (optional)" />
            </div>

            {error && <p className="mt-4 text-[14px] text-gold">{error}</p>}

            <div className="mt-10">
              {step < STEPS.length - 1 ? (
                <Cta type="button" onClick={next}>
                  Continue
                </Cta>
              ) : (
                <Cta type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Submit for review"}
                </Cta>
              )}
            </div>
          </form>
        </main>
      </div>
    </PageFrame>
  );
}
