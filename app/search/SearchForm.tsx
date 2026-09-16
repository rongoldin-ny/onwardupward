"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Cta, Logo, PageFrame } from "@/components/ui";
import { SelectField, textareaClass } from "@/components/fields";
import { ROLE_TYPES } from "@/lib/taxonomy";

const STAGE_OPTIONS = [
  { value: "", label: "Any career stage" },
  { value: "early", label: "Early" },
  { value: "mid", label: "Mid-career" },
  { value: "senior", label: "Senior+" },
  { value: "senior,director", label: "Senior+ · Director" },
  { value: "director", label: "Director+" },
];

export default function SearchForm({
  greetingText,
  countries,
  initial,
}: {
  greetingText: string;
  countries: string[];
  initial: { role: string; stages: string; location: string; q: string };
}) {
  const router = useRouter();
  const [role, setRole] = useState(initial.role);
  const [stages, setStages] = useState(initial.stages);
  const [location, setLocation] = useState(initial.location);
  const [q, setQ] = useState(initial.q);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (stages) params.set("stages", stages);
    if (location) params.set("location", location);
    if (q.trim()) params.set("q", q.trim());
    startTransition(() => router.push(`/results?${params.toString()}`));
  }

  return (
    <PageFrame size="narrow">
    <div className="flex flex-1 flex-col px-7 pt-8 pb-8">
      <header className="md:hidden">
        <Logo full />
      </header>

      <main className="mt-[18%]">
        <h1 className="text-[38px] leading-[1.15] font-black tracking-[-0.02em] text-cream">
          {greetingText}.<br />
          <span className="text-secondary">Who shall we find for you?</span>
        </h1>

        <form className="mt-9 space-y-4" onSubmit={submit}>
          <SelectField
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[{ value: "", label: "Any role" }, ...ROLE_TYPES]}
          />
          <SelectField
            value={stages}
            onChange={(e) => setStages(e.target.value)}
            options={STAGE_OPTIONS}
          />
          <SelectField
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            options={[
              { value: "", label: "Anywhere" },
              ...countries.map((c) => ({ value: c, label: c })),
            ]}
          />
          <textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Describe them. The taste, the track record, the temperament…"
            rows={5}
            className={textareaClass}
          />
          <div className="pt-6">
            <Cta type="submit" disabled={pending}>
              {pending ? "Searching…" : "Begin"}
            </Cta>
          </div>
        </form>
      </main>
    </div>
    </PageFrame>
  );
}
