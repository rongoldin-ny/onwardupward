"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveCoachListing } from "@/app/actions/coaches";
import { DisciplineChips, MenteeChips, PhotoPicker } from "@/components/CoachFormFields";
import { TextField, TextArea } from "@/components/fields";
import { Cta, Eyebrow } from "@/components/ui";
import { type CoachDiscipline, type CoachRow } from "@/lib/coach-shared";

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
        <PhotoPicker preview={photoPreview} onPick={setPhotoPreview} />
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
        <DisciplineChips value={discipline} onChange={setDiscipline} />
        <MenteeChips value={mentees} onChange={setMentees} />
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
