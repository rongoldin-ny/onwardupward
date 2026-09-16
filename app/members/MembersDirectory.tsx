"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FilterRow, MultiSelect } from "@/components/MultiSelect";
import { Avatar, Card } from "@/components/ui";
import { CAREER_STAGES, ROLE_TYPES } from "@/lib/taxonomy";

export type MemberRow = {
  id: string;
  name: string | null;
  email: string | null;
  photo_url: string | null;
  role_type: string | null;
  career_stage: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  growth_goal: string | null;
  bio: string | null;
  vetting_status: "pending" | "approved";
  onboarding_complete: boolean;
  created_at: string;
  /** The member's own coach listing status, if they have one. */
  coachStatus: string | null;
};

type Status = "Approved" | "Pending review" | "Onboarding";
const STATUSES: Status[] = ["Approved", "Pending review", "Onboarding"];
const COACHING = ["Coaching", "Not coaching"];

const roleLabel = (v: string | null) => ROLE_TYPES.find((r) => r.value === v)?.label ?? null;
const stageLabel = (v: string | null) => CAREER_STAGES.find((s) => s.value === v)?.label ?? null;

function statusOf(m: MemberRow): Status {
  if (!m.onboarding_complete) return "Onboarding";
  return m.vetting_status === "approved" ? "Approved" : "Pending review";
}

const statusStyle: Record<Status, string> = {
  Approved: "border-success/35 text-success",
  "Pending review": "border-gold-border text-gold",
  Onboarding: "border-border-2 text-muted",
};

export default function MembersDirectory({ members }: { members: MemberRow[] }) {
  const [q, setQ] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [coaching, setCoaching] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return members.filter((m) => {
      if (
        needle &&
        ![m.name, m.email, m.bio, m.growth_goal, m.location_city, m.location_state, m.location_country]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle)
      )
        return false;
      if (roles.length > 0 && !roles.includes(roleLabel(m.role_type) ?? "")) return false;
      if (stages.length > 0 && !stages.includes(stageLabel(m.career_stage) ?? "")) return false;
      if (statuses.length > 0 && !statuses.includes(statusOf(m))) return false;
      if (coaching.length === 1 && coaching.includes("Coaching") !== !!m.coachStatus) return false;
      return true;
    });
  }, [members, q, roles, stages, statuses, coaching]);

  return (
    <div>
      <div className="relative mt-4 md:mt-8">
        <Search
          size={16}
          strokeWidth={1.5}
          className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-muted"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search members — name, email, background…"
          className="h-[52px] w-full rounded-full border border-border-1 bg-surface-2 pr-6 pl-12 text-[14px] text-cream placeholder:text-muted focus:border-gold-active focus:outline-none"
        />
      </div>

      <FilterRow className="mt-4">
        <MultiSelect label="Status" options={STATUSES} value={statuses} onChange={setStatuses} />
        <MultiSelect label="Discipline" options={ROLE_TYPES.map((r) => r.label)} value={roles} onChange={setRoles} />
        <MultiSelect label="Level" options={CAREER_STAGES.map((s) => s.label)} value={stages} onChange={setStages} />
        <MultiSelect label="Coaching" options={COACHING} value={coaching} onChange={setCoaching} />
      </FilterRow>

      <p className="mt-6 text-[12px] text-secondary">
        {filtered.length} {filtered.length === 1 ? "member" : "members"}
        {filtered.length !== members.length && ` of ${members.length}`}
      </p>

      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filtered.map((m) => {
          const status = statusOf(m);
          const headline = [roleLabel(m.role_type), stageLabel(m.career_stage)].filter(Boolean).join(" · ");
          const location = [m.location_city, m.location_state, m.location_country].filter(Boolean).join(", ");
          return (
            <Link key={m.id} href={`/admin/vetting/${m.id}`} className="block rounded-[20px]">
              <Card className="card-hover flex h-full min-w-0 flex-col">
                <div className="flex min-w-0 items-center gap-4">
                  <Avatar id={m.id} src={m.photo_url} size={64} />
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <h2 className="truncate text-[19px] font-black tracking-[-0.02em] text-cream">
                        {m.name ?? m.email ?? "Unnamed"}
                      </h2>
                      {m.coachStatus && (
                        <span className="eyebrow shrink-0 rounded-full border border-success/35 px-2 py-1 text-[9px] text-success">
                          Coach
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-[13px] text-secondary">
                      {headline || "No role yet"}
                      {location && ` · ${location}`}
                    </p>
                    <p className="mt-1 truncate text-[12px] text-muted">{m.email}</p>
                  </div>
                </div>

                {(m.growth_goal || m.bio) && (
                  <p className="mt-4 line-clamp-2 text-[14px] leading-[1.55] text-body-2">
                    {m.growth_goal ? (
                      <>
                        <span className="font-bold text-gold">Hoping to grow:</span> {m.growth_goal}
                      </>
                    ) : (
                      m.bio
                    )}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between gap-3 pt-3.5">
                  <p className="text-[12px] text-muted">
                    Joined{" "}
                    {new Date(m.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </p>
                  <span className={`eyebrow shrink-0 rounded-full border px-2.5 py-1.5 text-[9px] ${statusStyle[status]}`}>
                    {status}
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <p className="mt-6 rounded-[20px] border border-dashed border-border-2 px-5 py-8 text-center text-[14px] text-secondary">
          No members match — try loosening the filters.
        </p>
      )}
    </div>
  );
}
