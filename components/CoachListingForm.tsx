"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ImagePlus } from "lucide-react";
import { saveCoachListing } from "@/app/actions/coaches";
import { TextField, TextArea } from "@/components/fields";
import { Cta, Eyebrow } from "@/components/ui";
import {
  DISCIPLINE_OPTIONS,
  TARGET_MENTEE_OPTIONS,
  type CoachDiscipline,
  type CoachRow,
} from "@/lib/coach-shared";

/**
 * The one coach listing form — standalone coach onboarding, coach editing,
 * and member hybrid opt-in all render this with different prefills.
 */
export default function CoachListingForm({
  existing,
  prefill,
  submitLabel = "Save listing",
}: {
  existing: CoachRow | null;
  prefill: { name: string | null; email: string | null; photoUrl: string | null };
  submitLabel?: string;
}) {
  const router = useRouter();
  const [mentees, setMentees] = useState<string[]>(existing?.target_mentees ?? []);
  const [discipline, setDiscipline] = useState<CoachDiscipline | null>(
    existing?.disciplines ?? null,
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    existing?.photo_url ?? prefill.photoUrl,
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveCoachListing(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <section className="space-y-4">
        <Eyebrow>The essentials</Eyebrow>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Add photo or logo"
            className="flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-2 bg-surface-2"
          >
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus size={20} strokeWidth={1.5} className="text-secondary" />
            )}
          </button>
          <div className="text-[13px] leading-[1.5] text-secondary">
            Photo or logo.
            <br />
            Tap to {photoPreview ? "replace" : "add"}.
          </div>
          <input
            ref={fileRef}
            type="file"
            name="photo"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPhotoPreview(URL.createObjectURL(f));
            }}
          />
        </div>
        <TextField
          name="full_name"
          placeholder="Full name"
          defaultValue={existing?.full_name ?? prefill.name ?? ""}
        />
        <TextField
          name="email"
          type="email"
          placeholder="Email address"
          defaultValue={existing?.email ?? prefill.email ?? ""}
        />
        <TextArea
          name="short_description"
          rows={3}
          placeholder="Short description — who you are, in a couple of sentences"
          defaultValue={existing?.short_description ?? ""}
        />
        <TextArea
          name="offering"
          rows={3}
          placeholder="Your offering — what a session with you covers"
          defaultValue={existing?.offering ?? ""}
        />
        <div>
          <p className="text-[13px] text-secondary">What disciplines do you coach for?</p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {DISCIPLINE_OPTIONS.map((option) => {
              const on = discipline === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDiscipline(option.value)}
                  className={`rounded-full border px-4 py-2.5 text-[13px] ${
                    on ? "border-gold-active font-bold text-gold" : "border-border-2 text-body-2"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="disciplines" value={discipline ?? ""} />
        </div>
        <div>
          <p className="text-[13px] text-secondary">Who do you mentor?</p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {TARGET_MENTEE_OPTIONS.map((option) => {
              const on = mentees.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setMentees(on ? mentees.filter((m) => m !== option) : [...mentees, option])
                  }
                  className={`rounded-full border px-4 py-2.5 text-[13px] ${
                    on ? "border-gold-active font-bold text-gold" : "border-border-2 text-body-2"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {mentees.map((m) => (
            <input key={m} type="hidden" name="target_mentees" value={m} />
          ))}
        </div>
        <TextField
          name="best_for"
          placeholder="Best for — one line on who gets the most from you"
          defaultValue={existing?.best_for ?? ""}
        />
        <TextField
          name="booking_url"
          placeholder="Booking link — Calendly, website, or an email address"
          defaultValue={existing?.booking_url?.replace(/^mailto:/, "") ?? ""}
        />
      </section>

      <section className="space-y-4">
        <Eyebrow>Optional</Eyebrow>
        <TextField name="website" placeholder="Website" defaultValue={existing?.website ?? ""} />
        <TextField
          name="company"
          placeholder="Company name"
          defaultValue={existing?.company ?? ""}
        />
        <TextField
          name="pricing"
          placeholder="Pricing — a number or a range is fine"
          defaultValue={existing?.pricing ?? ""}
        />
      </section>

      {error && <p className="text-[14px] text-gold">{error}</p>}
      {saved && (
        <p className="rounded-[16px] border border-gold-border bg-gold-tint px-5 py-4 text-[13px] text-gold">
          Saved ✓
        </p>
      )}
      <Cta type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Cta>
    </form>
  );
}
