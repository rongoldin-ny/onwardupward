"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ArrowLeft, Camera, ImagePlus, X } from "lucide-react";
import {
  importFromLinks,
  saveBasics,
  saveContactPreference,
  savePhoto,
  saveReferences,
  saveStory,
  saveWork,
} from "@/app/actions/onboarding";
import { Cta, PageFrame } from "@/components/ui";
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

const STEPS = [
  { title: "Start with your links.", subtitle: "We'll read your portfolio and pre-fill what we can.", required: true },
  { title: "The basics.", subtitle: "Who you are and where you work from.", required: true },
  { title: "Your story.", subtitle: "Describe yourself and your superpowers.", required: false },
  { title: "Your work.", subtitle: "Where the taste shows.", required: false },
  { title: "References.", subtitle: "People who will vouch for you.", required: false },
  { title: "Your photo.", subtitle: "A face for the name.", required: true },
  { title: "Getting in touch.", subtitle: "How should companies reach you?", required: true },
];

type Props = {
  profile: Profile;
  work: WorkHistoryRow[];
  references: ReferenceRow[];
  exitHref?: string;
};

export default function CandidateWizard({ profile, work, references, exitHref = "/role" }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [profileData, setProfileData] = useState(profile);
  const [workData, setWorkData] = useState(work);
  const [importedNote, setImportedNote] = useState<string | null>(null);

  const brags: string[] = profileData.brags;
  const portfolioImages: PortfolioImage[] = profileData.portfolio_images;

  function submitStep(form: HTMLFormElement | null, index: number) {
    if (!form) return;
    const formData = new FormData(form);
    setError(null);
    startTransition(async () => {
      if (index === 0) {
        const result = await importFromLinks(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        if (result.profile) setProfileData(result.profile);
        if (result.work) setWorkData(result.work);
        setImportedNote(
          result.found.length > 0
            ? `From your portfolio we pre-filled: ${result.found.join(", ")}. Check it over — everything can be edited.`
            : null,
        );
        setStep(1);
        return;
      }
      let result: { error?: string } | void = undefined;
      switch (index) {
        case 1: result = await saveBasics(formData); break;
        case 2: result = await saveStory(formData); break;
        case 3: result = await saveWork(formData); break;
        case 4: result = await saveReferences(formData); break;
        case 5: result = await savePhoto(formData); break;
        case 6: await saveContactPreference(formData); return; // redirects
      }
      if (result && "error" in result && result.error) {
        setError(result.error);
      } else {
        setStep(index + 1);
      }
    });
  }

  const formRef = useRef<HTMLFormElement>(null);
  const skip = () => { setError(null); setStep(step + 1); };
  const back = () => (step === 0 ? router.push(exitHref) : (setError(null), setStep(step - 1)));

  return (
    <PageFrame size="narrow">
    <div className="flex flex-1 flex-col px-7 pt-7 pb-8">
      <header>
        <div className="relative flex items-center justify-center">
          <button type="button" onClick={back} aria-label="Back" className="absolute left-0 text-cream">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <p className="eyebrow text-secondary">Step {step + 1} of {STEPS.length}</p>
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

        {importedNote && step === 1 && (
          <div className="mt-6 rounded-[16px] border border-gold-border bg-gold-tint px-5 py-4 text-[13px] leading-[1.5] text-gold">
            {importedNote}
          </div>
        )}

        <form
          ref={formRef}
          className="mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            submitStep(e.currentTarget, step);
          }}
        >
          {step === 0 && <StepLinks profile={profileData} />}
          {step === 1 && <StepBasics profile={profileData} />}
          {step === 2 && <StepStory profile={profileData} work={workData} brags={brags} />}
          {step === 3 && <StepWork profile={profileData} existingImages={portfolioImages} />}
          {step === 4 && <StepReferences references={references} />}
          {step === 5 && <StepPhoto currentPhoto={profileData.photo_url} />}
          {step === 6 && <StepContact profile={profileData} />}

          {error && <p className="mt-4 text-[14px] text-gold">{error}</p>}

          <div className="mt-10">
            <Cta type="submit" disabled={pending}>
              {pending
                ? step === 0
                  ? "Reading your portfolio…"
                  : "Saving…"
                : step === STEPS.length - 1
                  ? "Finish"
                  : "Continue"}
            </Cta>
            {!STEPS[step].required && (
              <button
                type="button"
                onClick={skip}
                className="mt-5 block w-full text-center text-[15px] text-secondary"
              >
                Do this later
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
    </PageFrame>
  );
}

function StepLinks({ profile }: { profile: Profile }) {
  return (
    <div className="space-y-4">
      <TextField
        name="linkedin_url"
        placeholder="linkedin.com/in/…"
        defaultValue={profile.linkedin_url ?? ""}
      />
      <TextField
        name="portfolio_url"
        placeholder="Your portfolio URL (optional)"
        defaultValue={profile.portfolio_url ?? ""}
      />
      <TextField
        name="portfolio_password"
        placeholder="Portfolio password, if it has one"
        defaultValue={profile.portfolio_password ?? ""}
      />
      <p className="pt-1 text-[13px] leading-[1.5] text-secondary">
        Share your portfolio and we&apos;ll pull in your name, bio, roles,
        experience, and location — you review everything before it goes live.
        If it&apos;s password-protected, the password lets us read it too.
      </p>
    </div>
  );
}

function StepBasics({ profile }: { profile: Profile }) {
  const [industries, setIndustries] = useState<string[]>(profile.industries);
  const [customIndustry, setCustomIndustry] = useState("");

  function commitCustomIndustry() {
    const value = customIndustry.trim();
    if (value && !industries.some((i) => i.toLowerCase() === value.toLowerCase())) {
      setIndustries([...industries, value]);
    }
    setCustomIndustry("");
  }

  // Selected tags first (including custom ones the presets don't know about).
  const industryChips = [...new Set([...industries, ...INDUSTRIES])];
  return (
    <div className="space-y-4">
      <TextField name="name" placeholder="Full name" defaultValue={profile.name ?? ""} />
      <SelectField
        name="role_type"
        placeholder="Role"
        options={ROLE_TYPES}
        defaultValue={profile.role_type ?? ""}
      />
      <SelectField
        name="career_stage"
        placeholder="Career stage"
        options={CAREER_STAGES}
        defaultValue={profile.career_stage ?? ""}
      />
      <TextField
        name="linkedin_url"
        placeholder="linkedin.com/in/…"
        defaultValue={profile.linkedin_url ?? ""}
      />
      <SelectField
        name="country"
        placeholder="Country"
        options={COUNTRIES}
        defaultValue={profile.location_country ?? ""}
      />
      <div className="flex gap-3.5">
        <TextField
          name="state"
          placeholder="State / province"
          defaultValue={profile.location_state ?? ""}
          className="min-w-0 flex-1"
        />
        <TextField
          name="city"
          placeholder="City"
          defaultValue={profile.location_city ?? ""}
          className="min-w-0 flex-1"
        />
      </div>
      <TextField
        name="years_experience"
        type="number"
        min={0}
        max={60}
        placeholder="Years of experience"
        defaultValue={profile.years_experience ?? ""}
      />
      <div>
        <p className="eyebrow mt-3 text-secondary">Industries</p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {industryChips.map((industry) => {
            const selected = industries.includes(industry);
            return (
              <button
                key={industry}
                type="button"
                onClick={() =>
                  setIndustries(
                    selected
                      ? industries.filter((i) => i !== industry)
                      : [...industries, industry],
                  )
                }
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
      </div>
    </div>
  );
}

function StepStory({
  profile,
  work,
  brags,
}: {
  profile: Profile;
  work: WorkHistoryRow[];
  brags: string[];
}) {
  return (
    <div className="space-y-7">
      <TextArea
        name="bio"
        rows={4}
        placeholder="Describe yourself and your superpowers…"
        defaultValue={profile.bio ?? ""}
      />
      <div>
        <p className="eyebrow text-secondary">Last three jobs</p>
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <TextField
                name={`job_title_${i}`}
                placeholder="Job title"
                defaultValue={work[i]?.title ?? ""}
                className="min-w-0 flex-1"
              />
              <TextField
                name={`job_company_${i}`}
                placeholder="Company"
                defaultValue={work[i]?.company ?? ""}
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
        defaultValue={profile.last_role_text ?? ""}
      />
      <TextArea
        name="dream_job"
        rows={3}
        placeholder="Describe your ideal next role…"
        defaultValue={profile.dream_job ?? ""}
      />
      <div>
        <p className="eyebrow text-secondary">Humblebrags</p>
        <p className="mt-2 text-[13px] text-secondary">Your five biggest career highlights.</p>
        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="flex items-center gap-4">
              <span className="w-3 shrink-0 text-[15px] font-bold text-gold">{n}</span>
              <TextField
                name={`brag_${n}`}
                placeholder={n === 1 ? "Shipped the thing everyone said was impossible…" : "Another highlight"}
                defaultValue={brags[n - 1] ?? ""}
                className="min-w-0 flex-1"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type WorkImageItem = {
  /** set for images already saved on the server */
  url?: string;
  /** set for freshly picked files */
  file?: File;
  preview: string;
  company: string;
  caption: string;
  year: string;
};

function StepWork({
  profile,
  existingImages,
}: {
  profile: Profile;
  existingImages: PortfolioImage[];
}) {
  const [items, setItems] = useState<WorkImageItem[]>(
    existingImages.map((img) => ({
      url: img.url,
      preview: img.url,
      company: img.company ?? "",
      caption: img.caption ?? "",
      year: img.year ?? "",
    })),
  );
  const fileRef = useRef<HTMLInputElement>(null);

  // Server expects kept urls first, then new files — keep meta in that order.
  const keptItems = items.filter((i) => i.url);
  const newItems = items.filter((i) => i.file);
  const meta = [...keptItems, ...newItems].map(({ company, caption, year }) => ({
    company,
    caption,
    year,
  }));

  const patch = (index: number, changes: Partial<WorkImageItem>) =>
    setItems(items.map((item, i) => (i === index ? { ...item, ...changes } : item)));

  return (
    <div className="space-y-4">
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
      <div>
        <p className="eyebrow mt-3 text-secondary">Portfolio images</p>
        <p className="mt-2 text-[13px] text-secondary">
          Up to ten. Add the company, a caption, and the year to each.
        </p>
        <div className="mt-4 space-y-4">
          {items.map((item, i) => (
            <div
              key={item.url ?? `new-${i}-${item.file?.name}`}
              className="rounded-[20px] border border-border-1 bg-surface-2 p-4"
            >
              <div className="flex gap-4">
                <div className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.preview}
                    alt=""
                    className="h-[104px] w-[104px] rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setItems(items.filter((_, j) => j !== i))}
                    aria-label="Remove image"
                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border border-border-2 bg-surface-1 text-secondary"
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                </div>
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="flex gap-2.5">
                    <input
                      value={item.company}
                      onChange={(e) => patch(i, { company: e.target.value })}
                      placeholder="Company"
                      className="h-[42px] min-w-0 flex-1 rounded-full border border-border-1 bg-surface-1 px-4 text-[13px] text-cream placeholder:text-muted focus:border-gold-active focus:outline-none"
                    />
                    <input
                      value={item.year}
                      onChange={(e) => patch(i, { year: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      placeholder="Year"
                      inputMode="numeric"
                      className="h-[42px] w-[76px] shrink-0 rounded-full border border-border-1 bg-surface-1 px-4 text-[13px] text-cream placeholder:text-muted focus:border-gold-active focus:outline-none"
                    />
                  </div>
                  <input
                    value={item.caption}
                    onChange={(e) => patch(i, { caption: e.target.value })}
                    placeholder="Caption — what is this?"
                    className="h-[42px] w-full rounded-full border border-border-1 bg-surface-1 px-4 text-[13px] text-cream placeholder:text-muted focus:border-gold-active focus:outline-none"
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
          }}
        />
      </div>
    </div>
  );
}

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

function StepReferences({ references }: { references: ReferenceRow[] }) {
  return (
    <div className="space-y-7">
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <p className="eyebrow text-secondary">Reference {i + 1}</p>
          <div className="mt-4 space-y-3">
            <TextField
              name={`ref_name_${i}`}
              placeholder="Full name"
              defaultValue={references[i]?.full_name ?? ""}
            />
            <TextField
              name={`ref_title_${i}`}
              placeholder="Current title"
              defaultValue={references[i]?.current_title ?? ""}
            />
            <TextField
              name={`ref_linkedin_${i}`}
              placeholder="linkedin.com/in/…"
              defaultValue={references[i]?.linkedin_url ?? ""}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StepPhoto({ currentPhoto }: { currentPhoto: string | null }) {
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const areaRef = useRef<Area | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function confirmCrop() {
    if (!rawImage || !areaRef.current) return;
    const img = new Image();
    img.src = rawImage;
    await new Promise((resolve) => (img.onload = resolve));
    const { x, y, width, height } = areaRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    canvas.getContext("2d")!.drawImage(img, x, y, width, height, 0, 0, 512, 512);
    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9),
    );
    setCroppedFile(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
    setCroppedUrl(URL.createObjectURL(blob));
    setRawImage(null);
  }

  const preview = croppedUrl ?? currentPhoto;

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="avatar-halo relative flex h-[160px] w-[160px] items-center justify-center overflow-hidden rounded-full border border-border-2 bg-surface-2"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Your photo" className="h-full w-full object-cover" />
        ) : (
          <Camera size={32} strokeWidth={1.5} className="text-secondary" />
        )}
      </button>
      <p className="mt-5 text-[13px] text-secondary">
        {preview ? "Tap to choose a different photo." : "Tap to add a photo."}
      </p>
      {croppedFile && <FileListInput files={[croppedFile]} name="photo" />}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            setRawImage(String(reader.result));
            setCrop({ x: 0, y: 0 });
            setZoom(1);
          };
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />

      {rawImage && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(10,10,12,0.85)] px-6">
          <div className="w-full max-w-[382px] rounded-[28px] border border-gold-border bg-surface-2 p-5">
            <h2 className="text-[20px] font-black tracking-[-0.02em] text-cream">
              Frame your photo
            </h2>
            <div className="relative mt-4 h-[300px] overflow-hidden rounded-[20px]">
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_area, pixels) => (areaRef.current = pixels)}
              />
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-5 w-full accent-[#E8C987]"
            />
            <div className="mt-4 flex gap-3">
              <Cta type="button" variant="secondary" onClick={() => setRawImage(null)}>
                Cancel
              </Cta>
              <Cta type="button" onClick={confirmCrop}>
                Use photo
              </Cta>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepContact({ profile }: { profile: Profile }) {
  const [pref, setPref] = useState(profile.contact_preference ?? "email");
  const options = [
    { value: "email", title: "Email me directly", note: "Recommended — the fastest way to a conversation." },
    { value: "linkedin", title: "LinkedIn only", note: "Companies will reach out through your LinkedIn profile." },
  ] as const;

  return (
    <div className="space-y-4">
      {options.map((option) => {
        const selected = pref === option.value;
        return (
          <label
            key={option.value}
            className={`block cursor-pointer rounded-[20px] border bg-surface-2 p-5 ${
              selected ? "border-gold-active" : "border-border-1"
            }`}
          >
            <input
              type="radio"
              name="contact_preference"
              value={option.value}
              checked={selected}
              onChange={() => setPref(option.value)}
              className="hidden"
            />
            <div className="flex items-center justify-between">
              <span className="text-[18px] font-bold tracking-[-0.02em] text-cream">
                {option.title}
              </span>
              <span
                className={`h-5 w-5 rounded-full border ${
                  selected ? "gold-gradient border-transparent" : "border-border-2"
                }`}
              />
            </div>
            <p className="mt-2 text-[13px] leading-[1.5] text-secondary">{option.note}</p>
          </label>
        );
      })}
    </div>
  );
}
