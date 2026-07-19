import { requireUser } from "@/lib/auth";
import SettingsShell from "../SettingsShell";
import PasswordForm from "./PasswordForm";

export default async function PasswordSettingsPage() {
  await requireUser();
  return (
    <SettingsShell title="Password." subtitle="Set a new one — takes effect immediately.">
      <PasswordForm />
    </SettingsShell>
  );
}
