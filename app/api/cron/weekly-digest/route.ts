import { sendWeeklyDigests } from "@/lib/notifications";

/**
 * Weekly digest job. Vercel Cron calls this with `Authorization: Bearer
 * $CRON_SECRET`; any other scheduler can do the same.
 *
 * Fails closed on purpose: with no CRON_SECRET configured this refuses to run
 * rather than defaulting to open, because an unauthenticated caller here would
 * email the entire member list.
 */
export const dynamic = "force-dynamic";
// 60s is the ceiling on Vercel's Hobby plan; asking for more fails the build.
export const maxDuration = 60;

export async function GET(request: Request): Promise<Response> {
  // Trimmed on both sides: a value pasted into a dashboard field can pick up a
  // trailing newline, and an exact compare would then reject every caller
  // forever with no way to tell that from a genuinely wrong token.
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return Response.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization")?.trim() !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendWeeklyDigests();
  // Counts only, no addresses — a weekly job nobody watches needs to leave a
  // trace in the logs saying what it actually did.
  console.log(`weekly-digest: ${JSON.stringify(result)}`);
  return Response.json({ ok: true, ...result });
}
