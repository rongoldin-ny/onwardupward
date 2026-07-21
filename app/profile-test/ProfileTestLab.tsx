"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { testProfileFill } from "@/app/actions/settings";
import type { AiFillResult } from "@/lib/ai-fill";
import CandidateProfileView, { type CandidateView } from "@/components/CandidateProfileView";
import { TextField } from "@/components/fields";
import { Cta, Eyebrow, Logo, PageFrame } from "@/components/ui";
import { labelForRoleType, uniqueCompanies } from "@/lib/taxonomy";

/** Build a throwaway CandidateView straight from an AI fill — no DB rows. */
function fillToView(fill: AiFillResult, portfolioUrl: string | null): CandidateView {
  const name = fill.name ?? "Unnamed candidate";
  const firstName = name.split(" ")[0];
  return {
    id: "profile-test",
    name,
    isSupporter: false,
    photoUrl: fill.photo_url,
    roleLabel: labelForRoleType(fill.role_type),
    city: fill.location_city ?? "Anywhere",
    firstName,
    bio: fill.bio,
    dreamJob: null,
    lastRole: fill.last_role_text,
    brags: fill.brags,
    companies: uniqueCompanies(fill.work.map((w) => w.company)),
    references: fill.references.map((r) => ({
      name: r.full_name,
      title: r.current_title ?? "",
      linkedin: r.linkedin_url,
    })),
    linkedinUrl: null,
    portfolioUrl,
    portfolioPassword: null,
    portfolioImages: fill.images.map((img) => ({
      url: img.url,
      company: img.company,
      caption: img.caption,
      year: img.year ?? "",
    })),
    yearsExperience: fill.years_experience,
    industries: fill.industries,
    contactNote: `${firstName} is a temporary test profile.`,
  };
}

export default function ProfileTestLab() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fill, setFill] = useState<AiFillResult | null>(null);
  const [testedUrl, setTestedUrl] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  async function run(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setTestedUrl(String(formData.get("portfolio_url") ?? "").trim() || null);
    setError(null);
    setPending(true);
    const result = await testProfileFill(formData);
    setPending(false);
    if (result.error || !result.fill) {
      setError(result.error ?? "Came back empty — try again.");
      return;
    }
    setFill(result.fill);
  }

  if (fill) {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-1 bg-surface-1 px-6 py-4">
          <p className="text-[13px] text-secondary">
            Test preview — nothing is saved. Refresh to discard.
          </p>
          <div className="flex gap-5">
            <button
              type="button"
              onClick={() => setShowJson(!showJson)}
              className="text-[13px] font-bold text-gold"
            >
              {showJson ? "Hide raw output" : "Raw output"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFill(null);
                setShowJson(false);
              }}
              className="text-[13px] font-bold text-gold"
            >
              Test another
            </button>
          </div>
        </div>
        {showJson && (
          <pre className="max-h-[40vh] overflow-auto border-b border-border-1 bg-surface-1 px-6 py-4 text-[12px] leading-[1.6] whitespace-pre-wrap text-body-2">
            {JSON.stringify(fill, null, 2)}
          </pre>
        )}
        <CandidateProfileView candidate={fillToView(fill, testedUrl)} mode="public" />
      </div>
    );
  }

  return (
    <PageFrame size="narrow">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-8">
        <header>
          <span className="md:hidden"><Logo /></span>
        </header>
        <main className="mt-12">
          <Eyebrow>Secret test lab</Eyebrow>
          <h1 className="mt-4 text-[32px] leading-[1.1] font-black tracking-[-0.02em] text-cream">
            Test the AI fill.
          </h1>
          <p className="mt-3 text-[15px] leading-[1.5] text-secondary">
            Enter someone&apos;s links, get the profile Claude would build for
            them. Temporary — nothing is saved anywhere.
          </p>
          <form className="mt-9 space-y-4" onSubmit={run}>
            <TextField
              name="portfolio_url"
              placeholder="Portfolio URL"
              autoFocus
            />
            <TextField
              name="portfolio_password"
              placeholder="Portfolio password (optional)"
            />
            <TextField name="linkedin_url" placeholder="LinkedIn URL (optional)" />
            <label className="flex h-[58px] w-full cursor-pointer items-center justify-between rounded-full border border-border-1 bg-surface-2 px-6 text-[15px] text-muted">
              <span className="min-w-0 truncate" data-resume-label>
                Résumé (PDF, optional)
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
              <span className="shrink-0 pl-3 text-[13px] font-bold text-gold">Browse</span>
            </label>
            {error && <p className="text-[14px] text-gold">{error}</p>}
            <Cta type="submit" disabled={pending} className="mt-3">
              <span className="flex items-center justify-center gap-2.5">
                <Sparkles size={16} strokeWidth={1.75} />
                {pending ? "Reading their work…" : "Generate preview"}
              </span>
            </Cta>
          </form>
        </main>
      </div>
    </PageFrame>
  );
}
