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
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendWeeklyDigests();
  return Response.json({ ok: true, ...result });
}
