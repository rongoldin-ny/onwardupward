import { supabaseAdmin } from "@/lib/supabase/server";
import { requireVetter } from "@/lib/vetting";
import { Card, Eyebrow, Logo, PageFrame } from "@/components/ui";
import AdminTabs from "../AdminTabs";

export const metadata = { title: "Analytics — onward/upward" };
export const dynamic = "force-dynamic";

type EventRow = {
  event_type: string;
  user_id: string | null;
  target_profile_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

function topN(counts: Map<string, number>, n = 8): [string, number][] {
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

/** Traffic, top pages, top profiles, top coaches — last 30 days. */
export default async function AnalyticsPage() {
  await requireVetter();
  const admin = supabaseAdmin();
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const { data: eventRows } = await admin
    .from("analytics_events")
    .select("event_type, user_id, target_profile_id, metadata, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);
  const events = (eventRows ?? []) as EventRow[];

  const pageViews = events.filter((e) => e.event_type === "page_view");
  const profileViews = events.filter((e) => e.event_type === "profile_view");
  const coachViews = events.filter((e) => e.event_type === "coach_view");
  const searches = events.filter((e) => e.event_type === "search_query");

  // Daily traffic, newest first.
  const byDay = new Map<string, number>();
  for (const e of pageViews) {
    const day = e.created_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const days = [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 14);
  const maxDay = Math.max(1, ...days.map(([, n]) => n));

  const topPages = topN(
    pageViews.reduce((m, e) => {
      const path = String(e.metadata?.path ?? "?");
      return m.set(path, (m.get(path) ?? 0) + 1);
    }, new Map<string, number>()),
  );

  // Resolve viewed-profile names.
  const profileCounts = profileViews.reduce((m, e) => {
    const id = e.target_profile_id ?? "?";
    return m.set(id, (m.get(id) ?? 0) + 1);
  }, new Map<string, number>());
  const topProfileIds = topN(profileCounts);
  const { data: nameRows } = await admin
    .from("profiles")
    .select("id, name, email")
    .in("id", topProfileIds.map(([id]) => id).filter((id) => id !== "?"));
  const nameById = new Map((nameRows ?? []).map((r) => [r.id, r.name ?? r.email ?? r.id]));

  const topCoaches = topN(
    coachViews.reduce((m, e) => {
      const key = `${String(e.metadata?.coach ?? "?")} (${String(e.metadata?.kind ?? "view")})`;
      return m.set(key, (m.get(key) ?? 0) + 1);
    }, new Map<string, number>()),
  );

  const recent = events.slice(0, 50);

  return (
    <PageFrame size="wide">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-10 lg:px-10">
        <header>
          <span className="md:hidden"><Logo /></span>
        </header>
        <main className="mx-auto w-full max-w-[640px] lg:max-w-none">
          <AdminTabs />

          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {(
              [
                ["Page views", pageViews.length],
                ["Profile views", profileViews.length],
                ["Coach clicks", coachViews.length],
                ["Searches", searches.length],
              ] as const
            ).map(([label, n]) => (
              <Card key={label} className="p-5">
                <p className="text-[30px] leading-none font-black tracking-[-0.02em] text-cream">
                  {n}
                </p>
                <p className="mt-2 text-[12px] text-secondary">{label} · 30 days</p>
              </Card>
            ))}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <section>
              <Eyebrow>Traffic by day</Eyebrow>
              <div className="mt-4 space-y-2">
                {days.map(([day, n]) => (
                  <div key={day} className="flex items-center gap-3">
                    <span className="w-[76px] shrink-0 font-mono text-[11px] text-secondary">
                      {day.slice(5)}
                    </span>
                    <div className="h-[10px] flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="gold-gradient h-full rounded-full"
                        style={{ width: `${Math.max(3, (n / maxDay) * 100)}%` }}
                      />
                    </div>
                    <span className="w-[40px] shrink-0 text-right text-[12px] text-body">{n}</span>
                  </div>
                ))}
                {days.length === 0 && (
                  <p className="text-[13px] text-secondary">No traffic logged yet.</p>
                )}
              </div>
            </section>

            <section>
              <Eyebrow>Top pages</Eyebrow>
              <div className="mt-4 space-y-2.5">
                {topPages.map(([path, n]) => (
                  <div key={path} className="flex items-center justify-between gap-3">
                    <span className="truncate font-mono text-[12px] text-body">{path}</span>
                    <span className="shrink-0 text-[12px] text-secondary">{n}</span>
                  </div>
                ))}
                {topPages.length === 0 && (
                  <p className="text-[13px] text-secondary">Nothing yet.</p>
                )}
              </div>
            </section>

            <section>
              <Eyebrow>Top profiles viewed</Eyebrow>
              <div className="mt-4 space-y-2.5">
                {topProfileIds.map(([id, n]) => (
                  <div key={id} className="flex items-center justify-between gap-3">
                    <span className="truncate text-[13px] text-body">
                      {nameById.get(id) ?? id}
                    </span>
                    <span className="shrink-0 text-[12px] text-secondary">{n}</span>
                  </div>
                ))}
                {topProfileIds.length === 0 && (
                  <p className="text-[13px] text-secondary">Nothing yet.</p>
                )}
              </div>
            </section>

            <section>
              <Eyebrow>Top coaches</Eyebrow>
              <div className="mt-4 space-y-2.5">
                {topCoaches.map(([label, n]) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <span className="truncate text-[13px] text-body">{label}</span>
                    <span className="shrink-0 text-[12px] text-secondary">{n}</span>
                  </div>
                ))}
                {topCoaches.length === 0 && (
                  <p className="text-[13px] text-secondary">No coach clicks yet.</p>
                )}
              </div>
            </section>
          </div>

          <section className="mt-10">
            <Eyebrow>Recent events</Eyebrow>
            <div className="mt-4 overflow-x-auto rounded-[16px] border border-border-1">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-border-1 text-secondary">
                    <th className="px-4 py-2.5 font-medium">When</th>
                    <th className="px-4 py-2.5 font-medium">Event</th>
                    <th className="px-4 py-2.5 font-medium">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((e, i) => (
                    <tr key={i} className="border-b border-border-1 last:border-0">
                      <td className="whitespace-nowrap px-4 py-2 font-mono text-muted">
                        {e.created_at.slice(5, 16).replace("T", " ")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-body">{e.event_type}</td>
                      <td className="max-w-[380px] truncate px-4 py-2 font-mono text-secondary">
                        {JSON.stringify(e.metadata)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </PageFrame>
  );
}
