import { redirect } from "next/navigation";
import { requireUser } from "./auth";
import type { Profile } from "./db";

/** Who may vet members: admins, plus Ron's own account. */
export function isVetter(user: Pick<Profile, "role" | "email"> | null): boolean {
  if (!user) return false;
  return user.role === "admin" || (user.email ?? "").toLowerCase() === "r@rongoldin.com";
}

export async function requireVetter(): Promise<Profile> {
  const user = await requireUser();
  if (!isVetter(user)) redirect("/");
  return user;
}
