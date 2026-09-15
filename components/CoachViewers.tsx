import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Avatar, Card } from "@/components/ui";
import type { CoachViewer } from "@/lib/coach-analytics";
import type { CoachMatch } from "@/lib/coach-match";
import { labelForCareerStage, labelForRoleType } from "@/lib/taxonomy";

/** Signed-in members who opened this coach's listing, with an optional AI-scored "possible match" note. */
export default function CoachViewers({
  viewers,
  matches = {},
}: {
  viewers: CoachViewer[];
  matches?: Record<string, CoachMatch>;
}) {
  if (viewers.length === 0) {
    return (
      <Card className="mt-3 p-5 text-center text-[13px] text-secondary">
        No members have viewed your listing yet.
      </Card>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {viewers.map(({ profile, viewedAt }) => {
        const match = matches[profile.id];
        return (
          <Card key={profile.id} className="p-4">
            <Link href={`/candidate/${profile.id}`} className="flex items-center gap-3.5">
              <Avatar id={profile.id} src={profile.photo_url} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-cream">
                  {profile.name ?? "A member"}
                </p>
                <p className="mt-0.5 truncate text-[12.5px] text-secondary">
                  {[labelForRoleType(profile.role_type), labelForCareerStage(profile.career_stage)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <span className="shrink-0 text-[11.5px] text-muted">
                {new Date(viewedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            </Link>
            {match?.isTopMatch && (
              <div className="mt-3 rounded-[14px] border border-gold-border bg-surface-1 px-4 py-3">
                <span className="eyebrow flex items-center gap-1.5 text-gold">
                  <Sparkles size={12} strokeWidth={1.5} />
                  Possible match
                </span>
                {match.reason && (
                  <p className="mt-1.5 text-[12.5px] leading-[1.5] text-body-2">{match.reason}</p>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
