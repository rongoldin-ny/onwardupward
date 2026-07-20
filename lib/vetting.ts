import { redirect } from "next/navigation";
import { requireUser } from "./auth";
import type { Profile } from "./db";

/** Who may vet members: admins, plus Ron's own account. */
export async function requireVetter(): Promise<Profile> {
  const user = await requireUser();
  const allowed =
    user.role === "admin" || (user.email ?? "").toLowerCase() === "r@rongoldin.com";
  if (!allowed) redirect("/");
  return user;
}
