import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function ProfileSettingsRedirect() {
  await requireUser();
  redirect("/profile");
}
