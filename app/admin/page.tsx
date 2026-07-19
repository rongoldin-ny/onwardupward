import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { Eyebrow, Logo, PageFrame } from "@/components/ui";

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await supabaseServer();
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();

  const [{ data: profiles }, { data: events }, { data: queries }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, role, created_at, is_paid, last_sign_in_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("analytics_events")
      .select("event_type, target_profile_id")
      .in("event_type", ["profile_view", "element_click"])
      .gte("created_at", weekAgo),
    supabase
      .from("analytics_events")
      .select("created_at, metadata, user_id")
      .eq("event_type", "search_query")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const views = new Map<string, number>();
  const clicks = new Map<string, number>();
  for (const e of events ?? []) {
    if (!e.target_profile_id) continue;
    const map = e.event_type === "profile_view" ? views : clicks;
    map.set(e.target_profile_id, (map.get(e.target_profile_id) ?? 0) + 1);
  }
  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  return (
    <PageFrame size="wide">
    <div className="flex flex-1 flex-col px-6 pt-8 pb-8 lg:px-10 lg:pb-10">
      <header className="flex items-center justify-between">
        <Logo />
        <form action={signOut}>
          <button type="submit" className="text-[13px] text-muted">
            Sign out
          </button>
        </form>
      </header>

      <main className="mt-10">
        <h1 className="text-[30px] leading-[1.1] font-black tracking-[-0.02em] text-cream">
          The back office.
        </h1>

        <Eyebrow className="mt-9">Members · {(profiles ?? []).length}</Eyebrow>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {(profiles ?? []).map((u) => (
            <div key={u.id} className="rounded-[20px] border border-border-1 bg-surface-2 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-[15px] font-bold text-cream">
                  {u.name ?? u.email ?? "—"}
                </p>
                <span className="eyebrow shrink-0 text-gold">
                  {u.role}
                  {u.role === "recruiter" && (u.is_paid ? " · paid" : " · unpaid")}
                </span>
              </div>
              <p className="mt-2 text-[12.5px] text-secondary">
                {u.email} · joined {String(u.created_at).slice(0, 10)}
              </p>
              <p className="mt-1 text-[12.5px] text-secondary">
                {views.get(u.id) ?? 0} views · {clicks.get(u.id) ?? 0} clicks (7d) · last
                sign-in{" "}
                {u.last_sign_in_at ? String(u.last_sign_in_at).slice(0, 10) : "never"}
              </p>
            </div>
          ))}
        </div>

        <Eyebrow className="mt-10">Recent searches</Eyebrow>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {(queries ?? []).length === 0 && (
            <p className="text-[13px] text-secondary">No searches yet.</p>
          )}
          {(queries ?? []).map((q, i) => {
            const meta = (q.metadata ?? {}) as Record<string, unknown>;
            const filters = [
              meta.role_filter,
              Array.isArray(meta.career_stage_filter)
                ? (meta.career_stage_filter as string[]).join("+")
                : "",
              meta.location_filter,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <div key={i} className="rounded-[20px] border border-border-1 bg-surface-2 p-4">
                <p className="text-[14px] text-body">
                  {meta.query_text ? `"${meta.query_text}"` : "(filters only)"}
                </p>
                <p className="mt-1.5 text-[12.5px] text-secondary">
                  {filters || "no filters"} · {String(meta.result_count ?? 0)} results ·{" "}
                  {(q.user_id && emailById.get(q.user_id)) ?? "unknown"} ·{" "}
                  {String(q.created_at).slice(0, 16)}
                </p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
    </PageFrame>
  );
}
