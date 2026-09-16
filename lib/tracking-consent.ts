import { headers } from "next/headers";

/**
 * True when the visitor's browser asks not to be tracked: Global Privacy
 * Control (`Sec-GPC: 1`) or Do Not Track (`DNT: 1`). Analytics writes skip
 * these visitors; operational records (rate limits, usage caps) still apply.
 * Promised in the Privacy Policy — keep them in sync.
 */
export async function trackingOptedOut(): Promise<boolean> {
  const h = await headers();
  return h.get("sec-gpc") === "1" || h.get("dnt") === "1";
}
