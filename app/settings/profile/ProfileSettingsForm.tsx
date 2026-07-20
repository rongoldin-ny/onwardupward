"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Link2, Sparkles, X } from "lucide-react";
import { fillProfileWithAI, reenrichProfile, saveFullProfile } from "@/app/actions/settings";
import { Eyebrow } from "@/components/ui";
import {
  CAREER_STAGES,
  COUNTRIES,
  ROLE_TYPES,
  SelectField,
  TextArea,
  TextField,
} from "@/components/fields";
import { INDUSTRIES } from "@/lib/taxonomy";
import type { PortfolioImage, Profile, ReferenceRow, WorkHistoryRow } from "@/lib/db";

type WorkImageItem = {
  url?: string;
  remoteUrl?: string; // AI-picked image still on the candidate's own site
  file?: File;
  preview: string;
  company: string;
  caption: string;
  year: string;
};

/** Mirrors a File[] held in React state into the form via a hidden input's FileList. */
function FileListInput({ files, name }: { files: File[]; name: string }) {
  const ref = useCallback(
    (node: HTMLInputElement | null) => {
      if (!node) return;
      const dt = new DataTransfer();
      for (const f of files) dt.items.add(f);
      node.files = dt.files;
    },
    [files],
  );
  return <input ref={ref} type="file" name={name} multiple className="hidden" />;
}

/** Grow a textarea to fit its content as the user types. */
function autoGrow(e: React.FormEvent<HTMLTextAreaElement>) {
  const t = e.currentTarget;
  t.style.height = "auto";
  t.style.height = `${t.scrollHeight}px`;
}

export default function ProfileSettingsForm({
  profile,
  work,
  references,
}: {
  profile: Profile;
  work: WorkHistoryRow[];
  references: ReferenceRow[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  // "Fill with AI": p/wk/rf drive the fillable defaults; bumping ver remounts
  // those sections so the proposed values appear.
  const formRef = useRef<HTMLFormElement>(null);
  const [p, setP] = useState(profile);
  const [wk, setWk] = useState(work);
  const [rf, setRf] = useState(references);
  const [ver, setVer] = useState(0);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [aiPending, setAiPending] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const [industries, setIndustries] = useState<string[]>(profile.industries);
  const [customIndustry, setCustomIndustry] = useState("");
  const [pref, setPref] = useState(profile.contact_preference);
  const [items, setItems] = useState<WorkImageItem[]>(
    profile.portfolio_images.map((img) => ({
      url: img.url,
      preview: img.url,
      company: img.company ?? "",
      caption: img.caption ?? "",
      year: img.year ?? "",
    })),
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceIndex = useRef<number>(-1);

  // ------------------------------------------------------------- autosave
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enrichTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const dirtyRef = useRef(false);

  const runSave = useCallback(async () => {
    if (!formRef.current) return;
    if (savingRef.current) {
      dirtyRef.current = true;
      return;
    }
    savingRef.current = true;
    dirtyRef.current = false;
    setSaveState("saving");
    const formData = new FormData(formRef.current);
    formData.set("autosave", "1");
    const result = await saveFullProfile(formData);
    savingRef.current = false;
    if (result.error) {
      setError(result.error);
      setSaveState("idle");
      return;
    }
    setError(null);
    setSaveState("saved");
    // Swap freshly-uploaded files / mirrored remotes for their storage urls
    // so the next autosave doesn't re-upload them. Saved order is
    // kept → remote → new, matching how the form composes its inputs.
    const saved = result.images;
    if (saved && !dirtyRef.current) {
      setItems((cur) => {
        const ordered = [
          ...cur.filter((i) => i.url),
          ...cur.filter((i) => i.remoteUrl),
          ...cur.filter((i) => i.file),
        ];
        if (ordered.length !== saved.length) return cur; // out of sync — retry next save
        return ordered.map((item, i) => ({
          url: saved[i].url,
          preview: saved[i].url,
          company: item.company,
          caption: item.caption,
          year: item.year,
        }));
      });
    }
    // Enrichment is expensive — kick it once, well after editing settles.
    if (enrichTimer.current) clearTimeout(enrichTimer.current);
    enrichTimer.current = setTimeout(() => void reenrichProfile(), 20_000);
    if (dirtyRef.current) scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void runSave(), 1500);
  }, [runSave]);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (enrichTimer.current) clearTimeout(enrichTimer.current);
    },
    [],
  );

  // ------------------------------------------------------------- AI fill
  async function handleAiFill() {
    if (!formRef.current || aiPending) return;
    const formData = new FormData(formRef.current);
    setError(null);
    setAiNotice(null);
    setAiPending(true);
    const result = await fillProfileWithAI(formData);
    setAiPending(false);
    if (result.error || !result.fill) {
      setError(result.error ?? "AI fill came back empty — please try again.");
      return;
    }
    const f = result.fill;
    setP((prev) => ({
      ...prev,
      name: f.name ?? prev.name,
      role_type: (f.role_type as Profile["role_type"]) ?? prev.role_type,
      career_stage: (f.career_stage as Profile["career_stage"]) ?? prev.career_stage,
      location_country: f.location_country ?? prev.location_country,
      location_state: f.location_state ?? prev.location_state,
      location_city: f.location_city ?? prev.location_city,
      years_experience: f.years_experience ?? prev.years_experience,
      bio: f.bio ?? prev.bio,
      last_role_text: f.last_role_text ?? prev.last_role_text,
      // dream_job is deliberately never AI-filled — that one stays theirs.
      brags: f.brags.length > 0 ? f.brags : prev.brags,
    }));
    if (f.work.length > 0) {
      setWk((prev) =>
        f.work.map(
          (w, i) => ({ ...(prev[i] ?? {}), title: w.title, company: w.company }) as WorkHistoryRow,
        ),
      );
    }
    if (f.industries.length > 0) {
      setIndustries((prev) => [...new Set([...prev, ...f.industries])]);
    }
    if (f.references.length > 0) {
      // Fill empty reference slots only — never displace someone they chose.
      setRf((prev) => {
        const next = [...prev];
        for (const candidate of f.references) {
          if (next.filter(Boolean).length >= 3) break;
          if (next.some((r) => r?.full_name === candidate.full_name)) continue;
          next.push({
            full_name: candidate.full_name,
            current_title: candidate.current_title ?? "",
            linkedin_url: candidate.linkedin_url ?? "",
          } as ReferenceRow);
        }
        return next.slice(0, 3);
      });
    }
    if (f.images.length > 0) {
      setItems((prev) => {
        const have = new Set(prev.map((i) => i.remoteUrl ?? i.url));
        const additions = f.images
          .filter((img) => !have.has(img.url))
          .slice(0, Math.max(0, 10 - prev.length))
          .map((img) => ({
            remoteUrl: img.url,
            preview: img.url,
            company: img.company,
            caption: img.caption,
            year: (img.year ?? "").replace(/\D/g, "").slice(0, 4),
          }));
        return [...prev, ...additions];
      });
    }
    setVer((v) => v + 1);
    setAiNotice(
      "Filled from your portfolio ✦ — review below and adjust anything that's off. Changes save automatically.",
    );
    scheduleSave();
  }

  // ------------------------------------------------------------- share
  async function handleShare() {
    const url = `${window.location.origin}/p/${profile.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareNotice("Public link copied — anyone with it can view your profile.");
    } catch {
      setShareNotice(`Your public link: ${url}`);
    }
    setTimeout(() => setShareNotice(null), 5000);
  }

  function commitCustomIndustry() {
    const value = customIndustry.trim();
    if (value && !industries.some((i) => i.toLowerCase() === value.toLowerCase())) {
      setIndustries([...industries, value]);
      scheduleSave();
    }
    setCustomIndustry("");
  }
  const industryChips = [...new Set([...industries, ...INDUSTRIES])];

  const keptItems = items.filter((i) => i.url);
  const remoteItems = items.filter((i) => i.remoteUrl);
  const newItems = items.filter((i) => i.file);
  const meta = [...keptItems, ...remoteItems, ...newItems].map(({ company, caption, year }) => ({
    company,
    caption,
    year,
  }));
  const patch = (index: number, changes: Partial<WorkImageItem>) => {
    setItems(items.map((item, i) => (i === index ? { ...item, ...changes } : item)));
    scheduleSave();
  };

  const inputSmall =
    "h-[42px] min-w-0 rounded-full border border-border-1 bg-surface-1 px-4 text-[13px] text-cream placeholder:text-muted focus:border-gold-active focus:outline-none";

  return (
    <form
      ref={formRef}
      onSubmit={(e) => e.preventDefault()}
      onInput={scheduleSave}
      className="space-y-9 pb-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAiFill}
          disabled={aiPending}
          className="flex h-[46px] items-center justify-center gap-2 rounded-full border border-gold-border px-5 text-[14px] font-bold text-gold disabled:opacity-60"
        >
          <Sparkles size={15} strokeWidth={1.75} />
          {aiPending ? "Reading your portfolio…" : "Fill with AI"}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex h-[46px] items-center justify-center gap-2 rounded-full border border-border-2 px-5 text-[14px] font-bold text-cream"
        >
          <Link2 size={15} strokeWidth={1.75} />
          Share
        </button>
        <span className="ml-auto text-[12px] text-secondary" aria-live="polite">
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : ""}
        </span>
      </div>

      {error && <p className="text-[14px] text-gold">{error}</p>}
      {aiNotice && (
        <p className="rounded-[16px] border border-gold-border bg-gold-tint px-5 py-4 text-[13px] leading-[1.5] text-gold">
          {aiNotice}
        </p>
      )}
      {shareNotice && (
        <p className="rounded-[16px] border border-gold-border bg-gold-tint px-5 py-4 text-[13px] leading-[1.5] break-all text-gold">
          {shareNotice}
        </p>
      )}

      <section key={`basics-${ver}`} className="space-y-4">
        <Eyebrow>The basics</Eyebrow>
        <TextField name="name" placeholder="Full name" defaultValue={p.name ?? ""} />
        <SelectField
          name="role_type"
          placeholder="Role"
          options={ROLE_TYPES}
          defaultValue={p.role_type ?? ""}
        />
        <SelectField
          name="career_stage"
          placeholder="Career stage"
          options={CAREER_STAGES}
          defaultValue={p.career_stage ?? ""}
        />
        <TextField
          name="linkedin_url"
          placeholder="linkedin.com/in/…"
          defaultValue={p.linkedin_url ?? ""}
        />
        <SelectField
          name="country"
          placeholder="Country"
          options={COUNTRIES}
          defaultValue={p.location_country ?? ""}
        />
        <div className="flex gap-3.5">
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
        <TextField
          name="years_experience"
          type="number"
          min={0}
          max={60}
          placeholder="Years of experience"
          defaultValue={p.years_experience ?? ""}
        />
      </section>

      <section>
        <Eyebrow>Industries</Eyebrow>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {industryChips.map((industry) => {
            const selected = industries.includes(industry);
            return (
              <button
                key={industry}
                type="button"
                onClick={() => {
                  setIndustries(
                    selected
                      ? industries.filter((i) => i !== industry)
                      : [...industries, industry],
                  );
                  scheduleSave();
                }}
                className={`rounded-full border px-4 py-2.5 text-[13px] ${
                  selected
                    ? "border-gold-active font-bold text-gold"
                    : "border-border-2 text-body-2"
                }`}
              >
                {industry}
              </button>
            );
          })}
        </div>
        <input
          value={customIndustry}
          onChange={(e) => setCustomIndustry(e.target.value)}
          onBlur={commitCustomIndustry}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commitCustomIndustry();
            }
          }}
          placeholder="Add your own — press enter"
          className="mt-4 h-[46px] w-full rounded-full border border-border-1 bg-surface-2 px-5 text-[13px] text-cream placeholder:text-muted focus:border-gold-active focus:outline-none"
        />
        {industries.map((industry) => (
          <input key={industry} type="hidden" name="industries" value={industry} />
        ))}
      </section>

      <section key={`story-${ver}`} className="space-y-4">
        <Eyebrow>Your story</Eyebrow>
        <TextArea
          name="bio"
          rows={4}
          placeholder="Describe yourself and your superpowers…"
          defaultValue={p.bio ?? ""}
        />
        <div>
          <p className="text-[13px] text-secondary">Last three jobs</p>
          <div className="mt-3 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <TextField
                  name={`job_title_${i}`}
                  placeholder="Job title"
                  defaultValue={wk[i]?.title ?? ""}
                  className="min-w-0 flex-1"
                />
                <TextField
                  name={`job_company_${i}`}
                  placeholder="Company"
                  defaultValue={wk[i]?.company ?? ""}
                  className="min-w-0 flex-1"
                />
              </div>
            ))}
          </div>
        </div>
        <TextArea
          name="last_role_text"
          rows={3}
          placeholder="Your most recent role — what are you most proud of?"
          defaultValue={p.last_role_text ?? ""}
        />
        <TextArea
          name="dream_job"
          rows={3}
          placeholder="Describe your ideal next role…"
          defaultValue={p.dream_job ?? ""}
        />
        <div>
          <p className="text-[13px] text-secondary">Humblebrags — your five biggest highlights</p>
          <div className="mt-3 space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex gap-4">
                <span className="w-3 shrink-0 pt-4 text-[15px] font-bold text-gold">{n}</span>
                <TextArea
                  name={`brag_${n}`}
                  rows={2}
                  onInput={autoGrow}
                  placeholder="A career highlight"
                  defaultValue={p.brags[n - 1] ?? ""}
                  className="min-w-0 flex-1 overflow-hidden px-5 py-3.5 text-[14px]"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <Eyebrow>Your work</Eyebrow>
        <TextField
          name="portfolio_url"
          placeholder="Portfolio URL"
          defaultValue={profile.portfolio_url ?? ""}
        />
        <TextField
          name="portfolio_password"
          placeholder="Portfolio password (optional)"
          defaultValue={profile.portfolio_password ?? ""}
        />
        <div className="space-y-4">
          {items.map((item, i) => (
            <div
              key={item.url ?? item.remoteUrl ?? `new-${i}-${item.file?.name}`}
              className="relative rounded-[20px] border border-border-1 bg-surface-2 p-4"
            >
              <button
                type="button"
                onClick={() => {
                  setItems(items.filter((_, j) => j !== i));
                  scheduleSave();
                }}
                aria-label="Remove image"
                className="absolute -top-2.5 -right-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-border-2 bg-surface-1 text-secondary"
              >
                <X size={13} strokeWidth={2} />
              </button>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    replaceIndex.current = i;
                    replaceRef.current?.click();
                  }}
                  aria-label="Replace image"
                  title="Tap to replace this image"
                  className="group relative shrink-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.preview}
                    alt=""
                    className="h-[104px] w-[104px] rounded-xl object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <ImagePlus size={18} strokeWidth={1.5} className="text-cream" />
                  </span>
                </button>
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="flex gap-2.5">
                    <input
                      value={item.company}
                      onChange={(e) => patch(i, { company: e.target.value })}
                      placeholder="Company"
                      className={`${inputSmall} flex-1`}
                    />
                    <input
                      value={item.year}
                      onChange={(e) =>
                        patch(i, { year: e.target.value.replace(/\D/g, "").slice(0, 4) })
                      }
                      placeholder="Year"
                      inputMode="numeric"
                      className={`${inputSmall} w-[76px] shrink-0`}
                    />
                  </div>
                  <input
                    value={item.caption}
                    onChange={(e) => patch(i, { caption: e.target.value })}
                    placeholder="Caption — what is this?"
                    className={`${inputSmall} w-full`}
                  />
                </div>
              </div>
            </div>
          ))}
          {items.length < 10 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-[64px] w-full items-center justify-center gap-3 rounded-[20px] border border-dashed border-border-2 text-[14px] text-secondary"
            >
              <ImagePlus size={18} strokeWidth={1.5} />
              Add images
            </button>
          )}
        </div>
        {keptItems.map((item) => (
          <input key={item.url} type="hidden" name="existing_images" value={item.url} />
        ))}
        {remoteItems.map((item) => (
          <input key={item.remoteUrl} type="hidden" name="remote_images" value={item.remoteUrl} />
        ))}
        <input type="hidden" name="images_meta" value={JSON.stringify(meta)} />
        <FileListInput files={newItems.map((i) => i.file!)} name="images" />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            const room = 10 - items.length;
            setItems([
              ...items,
              ...files.slice(0, room).map((file) => ({
                file,
                preview: URL.createObjectURL(file),
                company: "",
                caption: "",
                year: "",
              })),
            ]);
            e.target.value = "";
            scheduleSave();
          }}
        />
        <input
          ref={replaceRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            const i = replaceIndex.current;
            if (file && i >= 0) {
              patch(i, {
                file,
                url: undefined,
                remoteUrl: undefined,
                preview: URL.createObjectURL(file),
              });
            }
            e.target.value = "";
            replaceIndex.current = -1;
          }}
        />
      </section>

      <section key={`refs-${ver}`} className="space-y-4">
        <Eyebrow>References</Eyebrow>
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3">
            <p className="text-[13px] text-secondary">Reference {i + 1}</p>
            <TextField
              name={`ref_name_${i}`}
              placeholder="Full name"
              defaultValue={rf[i]?.full_name ?? ""}
            />
            <TextField
              name={`ref_title_${i}`}
              placeholder="Current title"
              defaultValue={rf[i]?.current_title ?? ""}
            />
            <TextField
              name={`ref_linkedin_${i}`}
              placeholder="linkedin.com/in/…"
              defaultValue={rf[i]?.linkedin_url ?? ""}
            />
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <Eyebrow>Getting in touch</Eyebrow>
        {(
          [
            { value: "email", label: "Email me directly" },
            { value: "linkedin", label: "LinkedIn only" },
          ] as const
        ).map((option) => {
          const selected = pref === option.value;
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center justify-between rounded-[20px] border bg-surface-2 p-5 ${
                selected ? "border-gold-active" : "border-border-1"
              }`}
            >
              <input
                type="radio"
                name="contact_preference"
                value={option.value}
                checked={selected}
                onChange={() => {
                  setPref(option.value);
                  scheduleSave();
                }}
                className="hidden"
              />
              <span className="text-[15px] font-bold text-cream">{option.label}</span>
              <span
                className={`h-5 w-5 rounded-full border ${
                  selected ? "gold-gradient border-transparent" : "border-border-2"
                }`}
              />
            </label>
          );
        })}
      </section>

      <p className="text-[12px] text-muted">Changes save automatically as you edit.</p>
    </form>
  );
}
