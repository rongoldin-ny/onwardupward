import { requireUser } from "@/lib/auth";
import type { NotificationPrefs } from "@/lib/db";
import SettingsShell from "../SettingsShell";
import NotificationsForm from "./NotificationsForm";

const DEFAULTS: NotificationPrefs = {
  messages: true,
  weekly_digest: true,
  product_updates: true,
};

export default async function NotificationsSettingsPage() {
  const user = await requireUser();
  return (
    <SettingsShell title="Notifications." subtitle="Choose what lands in your inbox.">
      <NotificationsForm initial={{ ...DEFAULTS, ...(user.notification_prefs ?? {}) }} />
    </SettingsShell>
  );
}
