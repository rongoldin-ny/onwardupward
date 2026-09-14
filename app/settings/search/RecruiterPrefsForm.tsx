"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { saveRecruiterPrefs } from "@/app/actions/settings";
import { Cta, Eyebrow } from "@/components/ui";
import { CAREER_STAGES, ROLE_TYPES, inputClass } from "@/components/fields";

export default function RecruiterPrefsForm({
  initialCompanies,
  initialRoleTypes,
  initialStages,
}: {
  initialCompanies: string[];
  initialRoleTypes: string[];
  initialStages: string[];
}) {
  const router = useRouter();
  const [companies, setCompanies] = useState<string[]>(initialCompanies);
  const [companyDraft, setCompanyDraft] = useState("");
  const [roleTypes, setRoleTypes] = useState<string[]>(initialRoleTypes);
  const [stages, setStages] = useState<string[]>(initialStages);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function commitCompany() {
    const value = companyDraft.trim();
    if (value && !companies.includes(value)) setCompanies([...companies, value]);
    setCompanyDraft("");
  }
  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    const all = companyDraft.trim() ? [...companies, companyDraft.trim()] : companies;
    all.forEach((c) => formData.append("companies", c));
    roleTypes.forEach((r) => formData.append("role_types", r));
    stages.forEach((s) => formData.append("career_stages", s));
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveRecruiterPrefs(formData);
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2600);
      }
    });
  }

  const chip = (selected: boolean) =>
    `rounded-full border px-4 py-2.5 text-[13px] ${
      selected ? "border-gold-active font-bold text-gold" : "border-border-2 text-body-2"
    }`;

  return (
    <form onSubmit={submit} className="space-y-8 pb-4">
      <section>
        <Eyebrow>Your company</Eyebrow>
        {companies.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {companies.map((company) => (
              <span
                key={company}
                className="flex items-center gap-2 rounded-full border border-gold-border px-3.5 py-2 text-[13px] text-gold"
              >
                {company}
                <button
                  type="button"
                  aria-label={`Remove ${company}`}
                  onClick={() => setCompanies(companies.filter((c) => c !== company))}
                >
                  <X size={12} strokeWidth={2} />
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          value={companyDraft}
          onChange={(e) => setCompanyDraft(e.target.value)}
          onBlur={commitCompany}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commitCompany();
            }
          }}
          placeholder="Company name — press enter to add"
          className={`${inputClass} mt-4`}
        />
      </section>

      <section>
        <Eyebrow>Roles you&apos;re hiring</Eyebrow>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {ROLE_TYPES.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => toggle(roleTypes, setRoleTypes, role.value)}
              className={chip(roleTypes.includes(role.value))}
            >
              {role.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <Eyebrow>Career stages</Eyebrow>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {CAREER_STAGES.map((stage) => (
            <button
              key={stage.value}
              type="button"
              onClick={() => toggle(stages, setStages, stage.value)}
              className={chip(stages.includes(stage.value))}
            >
              {stage.label}
            </button>
          ))}
        </div>
      </section>

      {error && <p className="text-[14px] text-gold">{error}</p>}
      {saved && (
        <p className="rounded-[16px] border border-gold-border bg-gold-tint px-5 py-4 text-[13px] text-gold">
          Saved ✓
        </p>
      )}
      <Cta type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Cta>
    </form>
  );
}
