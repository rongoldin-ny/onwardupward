"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { ArrowUpRight } from "lucide-react";
import { CAREER_STAGES, ROLE_TYPES, SelectField, TextArea, TextField } from "@/components/fields";
import SuperpowersField from "@/components/SuperpowersField";
import { Eyebrow, Tag } from "@/components/ui";
import type { AiFillResult } from "@/lib/ai-fill";
import type { PortfolioImage } from "@/lib/db";
import type { ProfileView } from "@/lib/profile-view";
import { INDUSTRIES } from "@/lib/taxonomy";
import { autoGrow, CardSection as Section, chipClass, useEdit } from "./edit-context";
import PortfolioImagesField, {
  commitSavedItems,
  itemsFromImages,
  type WorkImageItem,
} from "./PortfolioImagesField";

export type PlayerCardHandle = {
  commitSavedImages: (saved: PortfolioImage[]) => void;
  applyFill: (fill: AiFillResult) => void;
};

/**
 * One portfolio image: full-bleed within the card; starts slightly inset and
 * zooms to edge-to-edge as it scrolls into view.
 */
function WorkImage({ image }: { image: PortfolioImage }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.intersectionRatio >= 0.45),
      { threshold: [0, 0.45, 1] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const metaLine = [image.company, image.year].filter(Boolean).join(" · ");
  return (
    <figure ref={ref} className="m-0">
      <div
        className={`overflow-hidden transition-all duration-700 ease-out ${
          inView ? "scale-100 rounded-none opacity-100" : "scale-[0.94] rounded-[20px] opacity-70"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.caption || "Portfolio piece"}
          className={`block h-auto w-full transition-transform duration-700 ease-out ${
            inView ? "scale-100" : "scale-105"
          }`}
        />
      </div>
      {(metaLine || image.caption) && (
        <figcaption className="px-6 pt-3 pb-1">
          {metaLine && <span className="eyebrow block text-gold">{metaLine}</span>}
          {image.caption && (
            <span className="mt-1.5 block text-[13px] leading-[1.5] text-secondary">
              {image.caption}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}

/** The front of the card — practitioner stats. */
export default function PlayerCard({
  view,
  ver,
  communitySkills,
  ref,
}: {
  view: ProfileView;
  ver: number;
  communitySkills: string[];
  ref?: Ref<PlayerCardHandle>;
}) {
  const { editing, viewer, track, scheduleSave } = useEdit();
  const p = view.raw.profile;
  const player = view.player;
  const [industries, setIndustries] = useState<string[]>(player?.industries ?? []);
  const [customIndustry, setCustomIndustry] = useState("");
  const [items, setItems] = useState<WorkImageItem[]>(itemsFromImages(player?.portfolioImages ?? []));

  useImperativeHandle(ref, () => ({
    commitSavedImages: (saved) => setItems((cur) => commitSavedItems(cur, saved)),
    applyFill: (fill) => {
      if (fill.industries.length > 0) {
        setIndustries((prev) => [...new Set([...prev, ...fill.industries])]);
      }
      if (fill.images.length > 0) {
        setItems((prev) => {
          const have = new Set(prev.map((i) => i.remoteUrl ?? i.url));
          const additions = fill.images
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
    },
  }));

  if (!player || !p) return null;

  function commitCustomIndustry() {
    const value = customIndustry.trim();
    if (value && !industries.some((i) => i.toLowerCase() === value.toLowerCase())) {
      setIndustries([...industries, value]);
      scheduleSave();
    }
    setCustomIndustry("");
  }
  const industryChips = [...new Set([...industries, ...INDUSTRIES])];

  const headline = [player.roleLabel, player.careerStageLabel].filter(Boolean).join(" · ");
  const visibleImages = editing ? [] : player.portfolioImages;
  const isEmpty =
    !headline &&
    player.industries.length === 0 &&
    player.aiSuperpowers.length === 0 &&
    player.companies.length === 0 &&
    !player.dreamJob &&
    !player.growthGoal &&
    !player.lastRole &&
    player.brags.length === 0 &&
    player.references.length === 0 &&
    player.portfolioImages.length === 0;

  return (
    <div className="overflow-hidden rounded-[24px] border border-border-1 bg-surface-2 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow className="text-gold">Profile card</Eyebrow>
          {editing ? (
            <div key={`headline-${ver}`} className="mt-3 flex flex-col gap-3 sm:flex-row">
              <SelectField
                name="role_type"
                placeholder="Type of work"
                options={ROLE_TYPES}
                defaultValue={p.role_type ?? ""}
                className="min-w-0 flex-1"
              />
              <SelectField
                name="career_stage"
                placeholder="Career stage"
                options={CAREER_STAGES}
                defaultValue={p.career_stage ?? ""}
                className="min-w-0 flex-1"
              />
            </div>
          ) : (
            <h2 className="mt-2 text-[22px] leading-[1.15] font-black tracking-[-0.02em] text-cream">
              {headline || (viewer === "owner" ? "Add your type of work and stage." : view.firstName)}
            </h2>
          )}
        </div>
      </div>

      {!editing && isEmpty && (
        <p className="mt-5 text-[14px] text-secondary">
          {viewer === "owner" ? "Nothing on the card yet — tap Edit to add your stats." : "No stats yet."}
        </p>
      )}

      <div className="mt-6 space-y-6">
        {(editing || industries.length > 0 || player.industries.length > 0) && (
          <Section title="Industries">
            {editing ? (
              <>
                <div className="flex flex-wrap gap-2.5">
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
                        className={chipClass(selected)}
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
                  className="mt-4 h-[46px] w-full rounded-full border border-border-1 bg-surface-1 px-5 text-[13px] text-cream placeholder:text-muted focus:border-gold-active focus:outline-none"
                />
                {industries.map((industry) => (
                  <input key={industry} type="hidden" name="industries" value={industry} />
                ))}
              </>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {player.industries.map((i) => (
                  <Tag key={i}>{i}</Tag>
                ))}
              </div>
            )}
          </Section>
        )}

        {(editing || player.aiSuperpowers.length > 0) && (
          <Section title="AI superpowers">
            {editing ? (
              <SuperpowersField
                initial={player.aiSuperpowers}
                communitySkills={communitySkills}
                onChange={scheduleSave}
              />
            ) : (
              <ul className="space-y-2.5">
                {player.aiSuperpowers.map((s) => {
                  const rank = s.xp === "expert" ? 3 : s.xp === "fluent" ? 2 : 1;
                  return (
                    <li key={s.skill} className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-[14px] text-body">{s.skill}</span>
                      <span
                        className="flex shrink-0 gap-1"
                        title={
                          s.xp === "expert"
                            ? "Expert — can teach a class"
                            : s.xp === "fluent"
                              ? "Fluent"
                              : "Basic"
                        }
                      >
                        {[1, 2, 3].map((n) => (
                          <span
                            key={n}
                            className={`h-[6px] w-[16px] rounded-full ${
                              n <= rank ? "gold-gradient" : "bg-border-1"
                            }`}
                          />
                        ))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        )}

        {(editing || player.companies.length > 0) && (
          <Section title={editing ? "Last three jobs" : "Companies"}>
            {editing ? (
              <div key={`jobs-${ver}`} className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <TextField
                      name={`job_title_${i}`}
                      placeholder="Job title"
                      defaultValue={view.raw.work[i]?.title ?? ""}
                      className="min-w-0 flex-1"
                    />
                    <TextField
                      name={`job_company_${i}`}
                      placeholder="Company"
                      defaultValue={view.raw.work[i]?.company ?? ""}
                      className="min-w-0 flex-1"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {player.companies.map((c) => (
                  <Tag key={c}>{c}</Tag>
                ))}
              </div>
            )}
          </Section>
        )}

        {(editing || player.growthGoal) && (
          <Section title="Where I hope to grow">
            {editing ? (
              <TextArea
                key={`growth-${ver}`}
                name="growth_goal"
                rows={3}
                placeholder="What would you want a coach's help with?"
                defaultValue={p.growth_goal ?? ""}
              />
            ) : (
              <p className="text-[15px] leading-[1.5] text-body">{player.growthGoal}</p>
            )}
          </Section>
        )}

        {(editing || player.dreamJob) && (
          <Section title="The dream job">
            {editing ? (
              <TextArea
                key={`dream-${ver}`}
                name="dream_job"
                rows={3}
                placeholder="Describe your ideal next role…"
                defaultValue={p.dream_job ?? ""}
              />
            ) : (
              <p className="text-[15px] leading-[1.5] text-body">{player.dreamJob}</p>
            )}
          </Section>
        )}

        {(editing || player.lastRole) && (
          <Section title="In my last role">
            {editing ? (
              <TextArea
                key={`last-${ver}`}
                name="last_role_text"
                rows={3}
                placeholder="Your most recent role — what are you most proud of?"
                defaultValue={p.last_role_text ?? ""}
              />
            ) : (
              <p className="text-[15px] leading-[1.5] text-body">{player.lastRole}</p>
            )}
          </Section>
        )}

        {(editing || player.brags.length > 0) && (
          <Section title="Humblebrags">
            {editing ? (
              <div key={`brags-${ver}`} className="space-y-3">
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
            ) : (
              <ol className="space-y-3.5">
                {player.brags.map((brag, i) => (
                  <li key={brag} className="flex gap-3.5 text-[15px] leading-[1.5]">
                    <span className="font-bold text-gold">{i + 1}</span>
                    <span className="text-body">{brag}</span>
                  </li>
                ))}
              </ol>
            )}
          </Section>
        )}

        {(editing || player.references.length > 0) && (
          <Section title="References">
            {editing ? (
              <div key={`refs-${ver}`} className="space-y-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-3">
                    <p className="text-[13px] text-secondary">Reference {i + 1}</p>
                    <TextField
                      name={`ref_name_${i}`}
                      placeholder="Full name"
                      defaultValue={view.raw.references[i]?.full_name ?? ""}
                    />
                    <TextField
                      name={`ref_title_${i}`}
                      placeholder="Current title"
                      defaultValue={view.raw.references[i]?.current_title ?? ""}
                    />
                    <TextField
                      name={`ref_linkedin_${i}`}
                      placeholder="linkedin.com/in/…"
                      defaultValue={view.raw.references[i]?.linkedin_url ?? ""}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-4">
                {player.references.map((r) => (
                  <li key={r.name} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-bold text-cream">{r.name}</p>
                      <p className="truncate text-[13px] text-secondary">{r.title}</p>
                    </div>
                    {r.linkedin && (
                      <a
                        href={r.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${r.name} on LinkedIn`}
                        onClick={() => track("reference")}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-2"
                      >
                        <ArrowUpRight size={15} strokeWidth={1.5} className="text-gold" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        {editing && (
          <Section title="Portfolio images">
            <PortfolioImagesField items={items} onChange={setItems} />
          </Section>
        )}
      </div>

      {visibleImages.length > 0 && (
        <div className="-mx-6 mt-8 space-y-10 border-t border-border-1 pt-8">
          {visibleImages.map((image) => (
            <WorkImage key={image.url} image={image} />
          ))}
        </div>
      )}
    </div>
  );
}
