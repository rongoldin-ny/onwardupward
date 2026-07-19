"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, X } from "lucide-react";
import { saveRecruiterSearch } from "@/app/actions/onboarding";
import { Cta, PageFrame } from "@/components/ui";
import { CAREER_STAGES, ROLE_TYPES, inputClass } from "@/components/fields";

export default function RecruiterWizard({
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
  const [pending, startTransition] = useTransition();

  function commitCompany() {
    const value = companyDraft.trim();
    if (value && !companies.includes(value)) setCompanies([...companies, value]);
    setCompanyDraft("");
  }

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData();
    const allCompanies = companyDraft.trim()
      ? [...companies, companyDraft.trim()]
      : companies;
    allCompanies.forEach((c) => formData.append("companies", c));
    roleTypes.forEach((r) => formData.append("role_types", r));
    stages.forEach((s) => formData.append("career_stages", s));
    setError(null);
    startTransition(async () => {
      const result = await saveRecruiterSearch(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <PageFrame size="narrow">
    <div className="flex flex-1 flex-col px-7 pt-7 pb-8">
      <header>
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={() => router.push("/role")}
            aria-label="Back"
            className="absolute left-0 text-cream"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <p className="eyebrow text-secondary">Step 1 of 1</p>
        </div>
        <div className="mt-5 flex gap-1.5">
          <div className="gold-gradient h-[3px] flex-1 rounded-full" />
        </div>
      </header>

      <main className="mt-10 flex-1">
        <h1 className="text-[34px] leading-[1.08] font-black tracking-[-0.02em] text-cream">
          About your search.
        </h1>
        <p className="mt-3 text-[17px] text-secondary">
          Who you are, and who you&apos;re looking for.
        </p>

        <form className="mt-8" onSubmit={submit}>
          <p className="eyebrow text-secondary">Your company</p>
          <div className="mt-4">
            {companies.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
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
              className={inputClass}
            />
          </div>

          <p className="eyebrow mt-8 text-secondary">Roles you&apos;re hiring</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {ROLE_TYPES.map((role) => {
              const selected = roleTypes.includes(role.value);
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => toggle(roleTypes, setRoleTypes, role.value)}
                  className={`rounded-full border px-4 py-2.5 text-[13px] ${
                    selected
                      ? "border-gold-active font-bold text-gold"
                      : "border-border-2 text-body-2"
                  }`}
                >
                  {role.label}
                </button>
              );
            })}
          </div>

          <p className="eyebrow mt-8 text-secondary">Career stages</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {CAREER_STAGES.map((stage) => {
              const selected = stages.includes(stage.value);
              return (
                <button
                  key={stage.value}
                  type="button"
                  onClick={() => toggle(stages, setStages, stage.value)}
                  className={`rounded-full border px-4 py-2.5 text-[13px] ${
                    selected
                      ? "border-gold-active font-bold text-gold"
                      : "border-border-2 text-body-2"
                  }`}
                >
                  {stage.label}
                </button>
              );
            })}
          </div>

          {error && <p className="mt-4 text-[14px] text-gold">{error}</p>}

          <div className="mt-10">
            <Cta type="submit" disabled={pending}>
              {pending ? "Saving…" : "Continue"}
            </Cta>
          </div>
        </form>
      </main>
    </div>
    </PageFrame>
  );
}
