"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { COUNTRIES, SelectField, TextArea, TextField } from "@/components/fields";
import type { ProfileView } from "@/lib/profile-view";
import { CoachConnect } from "./CoachCard";
import { Labeled, RequiredPill, useEdit } from "./edit-context";
import PhotoField from "./PhotoField";

/** Left panel: the basics every profile shares, required-first. */
export default function IdentityPanel({ view, ver }: { view: ProfileView; ver: number }) {
  const { editing, viewer, track } = useEdit();
  const [expanded, setExpanded] = useState(false);
  const p = view.raw.profile;
  const missing = new Set<string>(view.missingRequired);
  const pill = (label: string) => (editing && missing.has(label) ? <RequiredPill /> : null);

  const metaLine = [
    view.location,
    view.yearsExperience !== null ? `${view.yearsExperience} years` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col items-center text-center lg:sticky lg:top-2 lg:items-start lg:text-left">
      <PhotoField
        id={view.id}
        current={view.photoUrl}
        required={missing.has("photo")}
        isCoach={view.coach?.status === "approved" || view.coach?.status === "unclaimed"}
      />

      {editing && p ? (
        <div key={`identity-${ver}`} className="mt-7 w-full space-y-5 text-left">
          <Labeled label="Name" pill={pill("name")}>
            <TextField name="name" placeholder="Full name" defaultValue={p.name ?? ""} />
          </Labeled>
          <Labeled label="Email" pill={pill("email")}>
            <p className="px-1 text-[14px] text-body-2">
              {p.email ?? "—"}
              <span className="text-muted"> · from your Google account</span>
            </p>
          </Labeled>
          <Labeled label="Location" pill={pill("location")}>
            <SelectField
              name="country"
              placeholder="Country"
              options={COUNTRIES}
              defaultValue={p.location_country ?? ""}
            />
            <div className="mt-3 flex gap-3">
              <TextField
                name="state"
                placeholder="State / province"
                defaultValue={p.location_state ?? ""}
                className="min-w-0 flex-1"
              />
              <TextField
                name="city"
                placeholder="City"
                defaultValue={p.location_city ?? ""}
                className="min-w-0 flex-1"
              />
            </div>
          </Labeled>
          <Labeled label="Years of experience" pill={pill("years of experience")}>
            <TextField
              name="years_experience"
              type="number"
              min={0}
              max={60}
              placeholder="Years"
              defaultValue={p.years_experience ?? ""}
            />
          </Labeled>
          <Labeled label="Background" pill={pill("background")}>
            <TextArea
              name="bio"
              rows={5}
              placeholder="Who you are and how you got here…"
              defaultValue={p.bio ?? ""}
            />
          </Labeled>
          <Labeled label="Links" pill={pill("a link")}>
            <div className="space-y-3">
              <TextField
                name="linkedin_url"
                placeholder="linkedin.com/in/…"
                defaultValue={p.linkedin_url ?? ""}
              />
              <TextField
                name="portfolio_url"
                placeholder="Portfolio URL"
                defaultValue={p.portfolio_url ?? ""}
              />
              <div>
                <TextField
                  name="portfolio_password"
                  placeholder="Portfolio password (optional)"
                  defaultValue={p.portfolio_password ?? ""}
                />
                <p className="mt-2 px-1 text-[12px] leading-[1.5] text-muted">
                  Only coaches on onward/upward can see your portfolio password, so they can open your work.
                </p>
              </div>
              <TextField
                name="website_url"
                placeholder="Website"
                defaultValue={p.website_url ?? ""}
              />
              <label className="flex h-[58px] w-full cursor-pointer items-center justify-between rounded-full border border-border-1 bg-surface-2 px-6 text-[15px] text-muted">
                <span className="min-w-0 truncate" data-resume-label>
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
                <span className="shrink-0 pl-3 text-[13px] font-bold text-gold">Browse</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-[20px] border border-border-1 bg-surface-2 p-4">
                <input
                  type="checkbox"
                  name="resume_public"
                  defaultChecked={p.resume_public}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#E8C987]"
                />
                <span className="text-[13px] leading-[1.5] text-body-2">
                  Make my resume available to coaches and hiring managers.
                </span>
              </label>
            </div>
          </Labeled>
          <label className="flex cursor-pointer items-start gap-3 rounded-[20px] border border-border-1 bg-surface-2 p-4">
            <input
              type="checkbox"
              name="open_to_coaching_outreach"
              defaultChecked={p.open_to_coaching_outreach}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#E8C987]"
            />
            <span className="text-[13px] leading-[1.5] text-body-2">
              It&apos;s okay for people to reach out to me for coaching opportunities.
            </span>
          </label>
        </div>
      ) : (
        <>
          <h1 className="mt-7 text-[30px] leading-[1.1] font-black tracking-[-0.02em] text-cream">
            {view.name}
          </h1>
          {metaLine && <p className="mt-2.5 text-[15px] text-secondary">{metaLine}</p>}
          {viewer === "owner" && view.email && (
            <p className="mt-1 text-[13px] text-muted">{view.email}</p>
          )}
          {view.background && (
            <div className="mt-6 w-full">
              <p className="eyebrow text-secondary">Background</p>
              <p
                className={`mt-3 text-[14px] leading-[1.55] text-body-2 ${
                  expanded ? "" : "line-clamp-4"
                }`}
              >
                {view.background}
              </p>
              {view.background.length > 200 && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="mt-2 text-[13px] font-bold text-gold"
                >
                  {expanded ? "Read less" : "Read more"}
                </button>
              )}
            </div>
          )}
          {view.urls.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 lg:justify-start">
              {view.urls.map((u) => (
                <a
                  key={u.label}
                  href={u.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => track(u.label === "LinkedIn" ? "linkedin" : "portfolio")}
                  className="inline-flex items-center gap-1.5 text-[14px] font-bold"
                >
                  {u.label}
                  <ArrowUpRight size={13} strokeWidth={2} />
                </a>
              ))}
            </div>
          )}
          {/* Only sent to the owner, coaches and admins (lib/profile-view.ts). */}
          {view.portfolioPassword && (
            <p className="mt-2 text-[12.5px] text-secondary">
              Portfolio password: <span className="font-bold text-body-2">{view.portfolioPassword}</span>
              {viewer === "owner" && <span className="block text-muted">Only coaches can see this.</span>}
            </p>
          )}
          {view.coach && viewer !== "owner" && (
            <div className="mt-6 w-full empty:hidden">
              <CoachConnect coach={view.coach} viewer={viewer} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
