"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Link2, Pencil, Sparkles, X } from "lucide-react";
import { submitCoachApplication } from "@/app/actions/coaches";
import { trackElementClick } from "@/app/actions/engage";
import { saveProfilePage } from "@/app/actions/profile";
import { fillProfileWithAI, reenrichProfile } from "@/app/actions/settings";
import { CtaLink, PageFrame } from "@/components/ui";
import type { CoachMatch } from "@/lib/coach-match";
import type { CoachReview } from "@/lib/coach-reviews-db";
import type { Profile } from "@/lib/db";
import type { ProfileView } from "@/lib/profile-view";
import CoachCard from "./CoachCard";
import { EditContext, type TrackedElement, type Viewer } from "./edit-context";
import FlipCard, { type CardSide } from "./FlipCard";
import IdentityPanel from "./IdentityPanel";
import PlayerCard, { type PlayerCardHandle } from "./PlayerCard";

/**
 * One profile for every user type. The owner edits in place — every field
 * lives in a single form that autosaves; visitors get the same layout
 * read-only.
 */
export default function ProfilePage({
  view,
  viewer,
  initialSide,
  communitySkills = [],
  topMatch = null,
  hasPendingClaim = false,
  reviews = [],
  ownReview = null,
}: {
  view: ProfileView;
  viewer: Viewer;
  initialSide: CardSide;
  communitySkills?: string[];
  topMatch?: Promise<CoachMatch | null> | null;
  hasPendingClaim?: boolean;
  reviews?: CoachReview[];
  ownReview?: CoachReview | null;
}) {
  const router = useRouter();
  const [v, setV] = useState(view);
  useEffect(() => setV(view), [view]);

  const [editing, setEditing] = useState(false);
  const [side, setSide] = useState<CardSide>(initialSide);
  const [coachingEnabled, setCoachingEnabled] = useState(!!view.coach);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [aiPending, setAiPending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ver, setVer] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const playerRef = useRef<PlayerCardHandle>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // ------------------------------------------------------------- autosave
  // The form only carries every field while editing; a save that ran after
  // the inputs unmounted would null them out, so saves are gated on this ref.
  const editingRef = useRef(false);
  editingRef.current = editing;
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enrichTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef<Promise<void> | null>(null);
  const dirtyRef = useRef(false);

  const runSave = useCallback(async () => {
    if (!formRef.current || !editingRef.current) return;
    if (inflight.current) {
      dirtyRef.current = true;
      return inflight.current;
    }
    dirtyRef.current = false;
    setSaveState("saving");
    const formData = new FormData(formRef.current);
    formData.set("autosave", "1");
    const run = (async () => {
      const result = await saveProfilePage(formData);
      if (result.error) {
        setError(result.error);
        setToast(result.error);
        setSaveState("idle");
        return;
      }
      setError(null);
      setSaveState("saved");
      if (result.images && !dirtyRef.current) playerRef.current?.commitSavedImages(result.images);
      setV((cur) => ({
        ...cur,
        photoUrl: result.photoUrl ?? cur.photoUrl,
        missingRequired: result.missingRequired ?? cur.missingRequired,
        coach: result.coach ?? cur.coach,
      }));
      if (enrichTimer.current) clearTimeout(enrichTimer.current);
      enrichTimer.current = setTimeout(() => void reenrichProfile(), 20_000);
    })();
    inflight.current = run;
    await run;
    inflight.current = null;
    if (dirtyRef.current && editingRef.current) await runSave();
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

  async function flushSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (inflight.current) await inflight.current;
    await runSave();
  }

  async function finishEditing() {
    await flushSave();
    setEditing(false);
    router.refresh();
  }

  async function handleSubmitApplication() {
    if (submitting) return;
    setSubmitting(true);
    if (editing) await flushSave();
    const result = await submitCoachApplication();
    setSubmitting(false);
    if (result.error) {
      setToast(result.error);
      return;
    }
    if (result.coach) setV((cur) => ({ ...cur, coach: result.coach ?? cur.coach }));
    setToast("Application sent ✓ — we'll email you when you're approved.");
  }

  // ------------------------------------------------------------- AI fill
  async function handleAiFill() {
    if (!formRef.current || aiPending) return;
    const formData = new FormData(formRef.current);
    setError(null);
    setAiPending(true);
    const result = await fillProfileWithAI(formData);
    setAiPending(false);
    if (result.error || !result.fill) {
      setError(result.error ?? "AI fill came back empty — please try again.");
      return;
    }
    const f = result.fill;
    setV((cur) => {
      const p = cur.raw.profile;
      if (!p) return cur;
      const profile: Profile = {
        ...p,
        name: f.name ?? p.name,
        role_type: f.role_type ?? p.role_type,
        career_stage: f.career_stage ?? p.career_stage,
        location_country: f.location_country ?? p.location_country,
        location_state: f.location_state ?? p.location_state,
        location_city: f.location_city ?? p.location_city,
        years_experience: f.years_experience ?? p.years_experience,
        bio: f.bio ?? p.bio,
        last_role_text: f.last_role_text ?? p.last_role_text,
        // dream_job is deliberately never AI-filled — that one stays theirs.
        brags: f.brags.length > 0 ? f.brags : p.brags,
      };
      const work =
        f.work.length > 0
          ? f.work.map((w, i) => ({ ...(cur.raw.work[i] ?? {}), title: w.title, company: w.company }))
          : cur.raw.work;
      const references = [...cur.raw.references];
      for (const candidate of f.references) {
        if (references.length >= 3) break;
        if (references.some((r) => r?.full_name === candidate.full_name)) continue;
        references.push({
          full_name: candidate.full_name,
          current_title: candidate.current_title ?? "",
          linkedin_url: candidate.linkedin_url ?? "",
        } as (typeof references)[number]);
      }
      return {
        ...cur,
        raw: { profile, work: work as typeof cur.raw.work, references },
      };
    });
    playerRef.current?.applyFill(f);
    setVer((n) => n + 1);
    setToast("Filled from your portfolio ✦ — review and adjust, changes save automatically.");
    scheduleSave();
  }

  async function share() {
    const url = `${window.location.origin}/p/${v.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast("Public link copied ✓");
    } catch {
      setToast(url);
    }
  }

  const track = useCallback(
    (element: TrackedElement) => {
      if (viewer === "member" && v.raw.profile) void trackElementClick(v.id, element);
    },
    [viewer, v.id, v.raw.profile],
  );

  const isOwner = viewer === "owner";
  const hasPlayer = !!v.player;

  const card = hasPlayer ? (
    <FlipCard
      side={side}
      onSide={setSide}
      front={<PlayerCard ref={playerRef} view={v} ver={ver} communitySkills={communitySkills} />}
      back={
        <CoachCard
          view={v}
          coachingEnabled={coachingEnabled}
          onStartCoaching={() => {
            setCoachingEnabled(true);
            setEditing(true);
          }}
          onSubmitApplication={handleSubmitApplication}
          submitting={submitting}
          topMatch={topMatch}
          hasPendingClaim={hasPendingClaim}
          reviews={reviews}
          ownReview={ownReview}
        />
      }
    />
  ) : (
    <CoachCard
      view={v}
      coachingEnabled={!!v.coach}
      onStartCoaching={() => {}}
      topMatch={topMatch}
      hasPendingClaim={hasPendingClaim}
      reviews={reviews}
      ownReview={ownReview}
    />
  );

  return (
    <PageFrame size="modal">
      <div className="flex flex-1 flex-col">
        {viewer === "public" && (
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-gold-border bg-gold-tint px-6 py-4">
            <p className="text-[14px] font-bold text-gold">
              onward/upward — a growth network for product designers and PMs.
            </p>
            <Link
              href="/signup"
              className="gold-gradient cta-glow shrink-0 rounded-full px-5 py-2.5 text-[14px] font-bold text-on-gold"
            >
              Sign up to join the network
            </Link>
          </div>
        )}

        <form
          ref={formRef}
          onSubmit={(e) => e.preventDefault()}
          onInput={editing ? scheduleSave : undefined}
          className="flex flex-1 flex-col px-6 pt-6 pb-8 lg:px-10 lg:pb-10"
        >
          <div className="hero-glow" />
          <header className="flex flex-wrap items-center justify-end gap-3">
            {isOwner && (
              <>
                <span className="mr-auto text-[12px] text-secondary" aria-live="polite">
                  {saveState === "saving"
                    ? "Saving…"
                    : saveState === "saved"
                      ? "Saved ✓ — autosaves as you type"
                      : editing
                        ? "Autosaves as you type"
                        : ""}
                </span>
                {editing && (
                  <button
                    type="button"
                    onClick={handleAiFill}
                    disabled={aiPending}
                    className="flex h-11 items-center gap-2 rounded-full border border-gold-border px-5 text-[14px] font-bold text-gold disabled:opacity-60"
                  >
                    <Sparkles size={15} strokeWidth={1.75} />
                    {aiPending ? "Reading your portfolio…" : "Fill with AI"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={share}
                  className="flex h-11 items-center gap-2 rounded-full border border-border-2 px-5 text-[14px] font-bold text-cream"
                >
                  <Link2 size={15} strokeWidth={1.75} />
                  Share
                </button>
                {editing ? (
                  <button
                    type="button"
                    onClick={finishEditing}
                    className="gold-gradient cta-glow flex h-11 items-center gap-2 rounded-full px-5 text-[14px] font-bold text-on-gold"
                  >
                    <Check size={15} strokeWidth={2.25} />
                    Done editing
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="flex h-11 items-center gap-2 rounded-full border border-gold-border px-5 text-[14px] font-bold text-gold"
                  >
                    <Pencil size={14} strokeWidth={1.75} />
                    Edit
                  </button>
                )}
              </>
            )}
            {viewer === "member" && (
              <button
                type="button"
                aria-label="Close"
                onClick={() => router.back()}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border-2"
              >
                <X size={16} strokeWidth={1.5} className="text-secondary" />
              </button>
            )}
          </header>

          {error && <p className="mt-4 text-[14px] text-gold">{error}</p>}

          <EditContext.Provider value={{ editing: isOwner && editing, viewer, scheduleSave, track }}>
            <main className="mt-4 lg:mt-6 lg:grid lg:grid-cols-[300px_1fr] lg:items-start lg:gap-12">
              <IdentityPanel view={v} ver={ver} />
              <div className="mt-9 lg:mt-0">{card}</div>
            </main>
          </EditContext.Provider>

          <input type="hidden" name="coaching_enabled" value={coachingEnabled ? "1" : ""} />

          {viewer === "public" && (
            <footer className="mt-10">
              <CtaLink href="/signup">Join the network</CtaLink>
            </footer>
          )}
          {editing && (
            <p className="mt-8 text-[12px] text-muted">
              Changes save automatically as you edit — &ldquo;Done editing&rdquo; just closes the editor.
            </p>
          )}
        </form>

        <div
          className={`fixed top-6 left-1/2 z-30 w-[calc(100%-48px)] max-w-[382px] -translate-x-1/2 rounded-full border border-gold-border bg-surface-2 px-6 py-4 text-center text-[15px] font-medium text-cream transition-opacity duration-300 ${
            toast ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {toast}
        </div>
      </div>
    </PageFrame>
  );
}
