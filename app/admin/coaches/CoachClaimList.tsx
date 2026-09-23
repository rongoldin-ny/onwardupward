"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Search } from "lucide-react";
import { Avatar, Card } from "@/components/ui";
import { FilterRow, MultiSelect } from "@/components/MultiSelect";

export type ClaimRow = {
  id: string;
  name: string;
  company: string | null;
  photoUrl: string | null;
  status: string;
  /** The account that owns it, once a claim has been approved. */
  claimedBy: string | null;
  hasPendingClaim: boolean;
};

const SITE = "https://onwardupward.io";
const STATES = ["Needs asking", "Claim pending", "Claimed"];

/** Where a listing has got to, in the words the outreach list needs. */
function stateOf(row: ClaimRow): string {
  if (row.claimedBy) return "Claimed";
  if (row.hasPendingClaim) return "Claim pending";
  return "Needs asking";
}

export default function CoachClaimList({ rows }: { rows: ClaimRow[] }) {
  const [q, setQ] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600);
    } catch {
      // Clipboard is blocked in some contexts; the link is on screen either way.
    }
  }

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (needle && ![r.name, r.company].filter(Boolean).join(" ").toLowerCase().includes(needle)) {
        return false;
      }
      return states.length === 0 || states.includes(stateOf(r));
    });
  }, [rows, q, states]);

  const unclaimed = shown.filter((r) => stateOf(r) === "Needs asking");

  return (
    <div>
      <div className="mt-6 flex items-center gap-3 rounded-full border border-border-1 bg-surface-2 px-5">
        <Search size={16} strokeWidth={1.5} className="shrink-0 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search coaches"
          aria-label="Search coaches"
          className="h-[46px] min-w-0 flex-1 bg-transparent text-[15px] text-cream placeholder:text-muted focus:outline-none"
        />
      </div>

      <FilterRow className="mt-4">
        <MultiSelect label="State" options={STATES} value={states} onChange={setStates} />
        {unclaimed.length > 0 && (
          <button
            type="button"
            onClick={() =>
              copy(
                unclaimed.map((r) => `${r.name}\t${SITE}/coaches/${r.id}`).join("\n"),
                "all",
              )
            }
            className="flex shrink-0 items-center gap-2 rounded-full border border-border-2 px-4 py-2 text-[13px] whitespace-nowrap text-body-2"
          >
            {copied === "all" ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.75} />}
            {copied === "all" ? "Copied" : `Copy ${unclaimed.length} unclaimed`}
          </button>
        )}
      </FilterRow>

      <p className="mt-4 text-[12px] text-secondary">
        {shown.length} {shown.length === 1 ? "listing" : "listings"}
        {shown.length !== rows.length && ` of ${rows.length}`}
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {shown.map((row) => {
          const state = stateOf(row);
          return (
            <Card key={row.id} className="flex min-w-0 flex-col">
              {/* The pill rides the meta line rather than the name's: at 375px
                  a "Needs asking" badge beside the name truncates the name. */}
              <div className="flex min-w-0 items-center gap-4">
                <Avatar id={row.id} src={row.photoUrl} size={48} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[17px] font-black tracking-[-0.02em] text-cream">
                    {row.name}
                  </h2>
                  <div className="mt-1.5 flex min-w-0 items-center gap-2">
                    <span
                      className={`eyebrow shrink-0 rounded-full border px-2.5 py-1 text-[9px] ${
                        state === "Claimed"
                          ? "border-success/35 text-success"
                          : state === "Claim pending"
                            ? "border-gold-active text-gold"
                            : "border-border-2 text-muted"
                      }`}
                    >
                      {state}
                    </span>
                    <p className="truncate text-[12.5px] text-secondary">
                      {row.claimedBy ? `Claimed by ${row.claimedBy}` : (row.company ?? "—")}
                    </p>
                  </div>
                </div>
              </div>

              {state !== "Claimed" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copy(`${SITE}/coaches/${row.id}`, `listing-${row.id}`)}
                    className="flex h-9 flex-1 items-center justify-center gap-2 rounded-full border border-gold-border px-4 text-[13px] font-bold whitespace-nowrap text-gold"
                  >
                    {copied === `listing-${row.id}` ? (
                      <Check size={13} strokeWidth={2} />
                    ) : (
                      <Copy size={13} strokeWidth={1.75} />
                    )}
                    {copied === `listing-${row.id}` ? "Copied" : "Copy listing link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(`${SITE}/claim/${row.id}`, `claim-${row.id}`)}
                    className="flex h-9 flex-1 items-center justify-center gap-2 rounded-full border border-border-2 px-4 text-[13px] whitespace-nowrap text-body-2"
                  >
                    {copied === `claim-${row.id}` ? (
                      <Check size={13} strokeWidth={2} />
                    ) : (
                      <Copy size={13} strokeWidth={1.75} />
                    )}
                    {copied === `claim-${row.id}` ? "Copied" : "Copy claim link"}
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {shown.length === 0 && (
        <p className="mt-6 text-[14px] text-secondary">Nothing matches — try loosening that.</p>
      )}
    </div>
  );
}
