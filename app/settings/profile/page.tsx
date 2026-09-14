import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function ProfileSettingsRedirect() {
  const user = await requireUser();
  redirect(user.role === "recruiter" ? "/settings/search" : "/profile");
}
