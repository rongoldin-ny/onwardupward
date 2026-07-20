import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireVetter } from "@/lib/vetting";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Profile } from "@/lib/db";
import { labelForRoleType } from "@/lib/taxonomy";
import { Avatar, Eyebrow, Logo, PageFrame } from "@/components/ui";

export const metadata = { title: "Vetting — onward/upward" };

/** The membership vetting queue: completed applications awaiting review. */
export default async function VettingQueuePage() {
  await requireVetter();

  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("*")
    .eq("role", "candidate")
    .eq("onboarding_complete", true)
    .eq("vetting_status", "pending")
    .order("updated_at", { ascending: false });
  const pending = (data ?? []) as Profile[];

  return (
    <PageFrame size="narrow">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-10">
        <header>
          <span className="md:hidden"><Logo /></span>
        </header>
        <main className="mt-10">
          <Eyebrow>Member vetting</Eyebrow>
          <h1 className="mt-4 text-[32px] leading-[1.1] font-black tracking-[-0.02em] text-cream">
            {pending.length === 0
              ? "Queue's clear."
              : `${pending.length} waiting for review.`}
          </h1>
          <p className="mt-3 text-[15px] text-secondary">
            New members stay invisible to recruiters and public links until you
            let them in.
          </p>

          <div className="mt-8 space-y-3">
            {pending.map((p) => (
              <Link
                key={p.id}
                href={`/admin/vetting/${p.id}`}
                className="flex items-center gap-4 rounded-[20px] border border-border-1 bg-surface-2 p-4"
              >
                <Avatar id={p.id} src={p.photo_url} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-bold text-cream">
                    {p.name ?? p.email ?? "Unnamed"}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-secondary">
                    {labelForRoleType(p.role_type)}
                    {p.location_city ? ` · ${p.location_city}` : ""}
                  </p>
                </div>
                <ArrowRight size={17} strokeWidth={1.5} className="shrink-0 text-gold" />
              </Link>
            ))}
            {pending.length === 0 && (
              <p className="rounded-[20px] border border-dashed border-border-2 px-5 py-8 text-center text-[14px] text-secondary">
                Applications land here — and in your inbox — the moment a new
                member finishes their profile.
              </p>
            )}
          </div>
        </main>
      </div>
    </PageFrame>
  );
}
