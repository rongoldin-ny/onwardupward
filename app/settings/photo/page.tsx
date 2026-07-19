import { requireCandidate } from "@/lib/auth";
import SettingsShell from "../SettingsShell";
import PhotoForm from "./PhotoForm";

export default async function PhotoSettingsPage() {
  const user = await requireCandidate();
  return (
    <SettingsShell title="Your photo." subtitle="A face for the name.">
      <PhotoForm currentPhoto={user.photo_url} />
    </SettingsShell>
  );
}
