import { supabaseAdmin } from "@/lib/supabase/server";
import { requireVetter } from "@/lib/vetting";
import { Logo, PageFrame } from "@/components/ui";
import AdminTabs from "../AdminTabs";
import FeedbackList, { type FeedbackRow } from "./FeedbackList";

export const metadata = { title: "Feedback — onward/upward" };
export const dynamic = "force-dynamic";

/** Every bug report and feature idea sent through the footer widget. */
export default async function FeedbackPage() {
  await requireVetter();
  const admin = supabaseAdmin();

  const { data: feedback } = await admin
    .from("feedback")
    .select("id, kind, message, path, resolved, created_at, user_id")
    .order("created_at", { ascending: false });

  const userIds = [...new Set((feedback ?? []).map((f) => f.user_id).filter(Boolean))] as string[];
  const { data: profiles } =
    userIds.length > 0
      ? await admin.from("profiles").select("id, name, email").in("id", userIds)
      : { data: [] };
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  const rows: FeedbackRow[] = (feedback ?? []).map((f) => ({
    id: f.id,
    kind: f.kind as "bug" | "feature",
    message: f.message,
    path: f.path,
    resolved: f.resolved,
    createdAt: f.created_at,
    by: f.user_id ? (byId.get(f.user_id)?.name ?? byId.get(f.user_id)?.email ?? "Member") : null,
  }));

  return (
    <PageFrame size="wide">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-10 lg:px-10">
        <header>
          <span className="md:hidden">
            <Logo />
          </span>
        </header>
        <main className="mx-auto w-full max-w-[640px] lg:max-w-none">
          <AdminTabs />
          <h1 className="mt-8 text-[30px] leading-[1.1] font-black tracking-[-0.02em] text-cream">
            Feedback.
          </h1>
          <p className="mt-3 text-[15px] leading-[1.5] text-secondary">
            {rows.length} {rows.length === 1 ? "submission" : "submissions"} from the footer
            widget.
          </p>
          <FeedbackList rows={rows} />
        </main>
      </div>
    </PageFrame>
  );
}
