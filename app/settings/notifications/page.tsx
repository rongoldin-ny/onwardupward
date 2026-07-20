import { requireUser } from "@/lib/auth";
import { ComingSoonPill } from "@/components/ui";
import SettingsShell from "../SettingsShell";

const upcoming = [
  { label: "New message alerts", note: "Know the moment a company writes to you." },
  { label: "Weekly profile digest", note: "Views, ranking, and who's been looking." },
  { label: "Product updates", note: "Occasional news from onward/upward. No noise." },
];

export default async function NotificationsSettingsPage() {
  await requireUser();
  return (
    <SettingsShell
      title="Notifications."
      subtitle="Fine-grained controls are on their way."
    >
      <div className="space-y-4">
        {upcoming.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-4 rounded-[20px] border border-dashed border-border-1 bg-surface-disabled p-5 opacity-65"
          >
            <div>
              <p className="text-[15px] font-bold text-secondary">{item.label}</p>
              <p className="mt-1 text-[12.5px] text-secondary">{item.note}</p>
            </div>
            <ComingSoonPill />
          </div>
        ))}
      </div>
    </SettingsShell>
  );
}
