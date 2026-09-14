import { redirect } from "next/navigation";

export default function CoachingSettingsRedirect() {
  redirect("/profile?side=coach");
}
