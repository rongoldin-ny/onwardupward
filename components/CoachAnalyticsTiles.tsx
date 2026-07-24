import { Card, Eyebrow } from "@/components/ui";
import type { CoachAnalytics } from "@/lib/coach-analytics";

function Tile({ label, value30d, valueAllTime }: { label: string; value30d: number; valueAllTime: number }) {
  return (
    <Card className="p-5">
      <Eyebrow>{label}</Eyebrow>
      <p className="mt-3 text-[32px] leading-none font-black tracking-[-0.02em] text-cream">
        {value30d}
      </p>
      <p className="mt-1.5 text-[12.5px] text-secondary">last 30 days · {valueAllTime} all-time</p>
    </Card>
  );
}

/** Impressions (seen in the directory) / Views (opened the detail page) / Requests (clicked Book). */
export default function CoachAnalyticsTiles({ analytics }: { analytics: CoachAnalytics }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Tile label="Impressions" value30d={analytics.impressions30d} valueAllTime={analytics.impressionsAllTime} />
      <Tile label="Views" value30d={analytics.views30d} valueAllTime={analytics.viewsAllTime} />
      <Tile label="Requests" value30d={analytics.requests30d} valueAllTime={analytics.requestsAllTime} />
    </div>
  );
}
