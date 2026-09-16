import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { Card, Eyebrow } from "@/components/ui";
import type { CoachAnalytics } from "@/lib/coach-analytics";

function Row({
  label,
  note,
  value30d,
  valueAllTime,
}: {
  label: string;
  note: string;
  value30d: number;
  valueAllTime: number;
}) {
  return (
    <Card className="flex items-center justify-between gap-6 p-5">
      <div className="min-w-0">
        <Eyebrow>{label}</Eyebrow>
        <p className="mt-2 text-[13px] leading-[1.5] text-secondary">{note}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[32px] leading-none font-black tracking-[-0.02em] text-cream">
          {value30d}
        </p>
        <p className="mt-1.5 text-[12.5px] whitespace-nowrap text-secondary">
          last 30 days · {valueAllTime} all-time
        </p>
      </div>
    </Card>
  );
}

/**
 * Impressions (seen in the directory) / Views (opened the detail page) /
 * Requests (clicked Book) — one row each, so the numbers have room to breathe
 * alongside an explanation of what each one counts.
 */
export default function CoachAnalyticsTiles({
  analytics,
  bookingUrl,
}: {
  analytics: CoachAnalytics;
  bookingUrl?: string | null;
}) {
  return (
    <div className="space-y-3">
      <Row
        label="Impressions"
        note="Times your card appeared in the coaches directory."
        value30d={analytics.impressions30d}
        valueAllTime={analytics.impressionsAllTime}
      />
      <Row
        label="Views"
        note="Times someone opened your full coach page."
        value30d={analytics.views30d}
        valueAllTime={analytics.viewsAllTime}
      />
      <Row
        label="Requests"
        note="Counted when a member sends you a request through the platform, or clicks through to your own booking link."
        value30d={analytics.requests30d}
        valueAllTime={analytics.requestsAllTime}
      />

      {!bookingUrl && (
        <Link href="/profile?side=coach" className="block">
          <Card className="flex items-center justify-between gap-4 border-gold-active p-5">
            <div className="flex items-start gap-3">
              <TriangleAlert size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold" />
              <div>
                <p className="text-[15px] font-bold text-cream">
                  You don&apos;t have a booking link set up.
                </p>
                <p className="mt-1 text-[13px] leading-[1.5] text-secondary">
                  Members can still message you through the platform. Adding a link lets
                  them book time with you directly instead.
                </p>
              </div>
            </div>
            <ArrowRight size={18} strokeWidth={1.5} className="shrink-0 text-gold" />
          </Card>
        </Link>
      )}
    </div>
  );
}
