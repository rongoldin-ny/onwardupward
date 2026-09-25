import { currentUser, onWaitlist } from "@/lib/auth";
import SiteNavClient from "./SiteNavClient";

/**
 * Persistent top-level nav — Settings, Coaches, Reads, and the profile
 * avatar — mounted once in the root layout so it's on every signed-in
 * screen, including sub-pages like /coaches/[id]. Renders nothing for
 * signed-out visitors (the marketing home and coach-detail share links have
 * their own chrome).
 */
export default async function SiteNav() {
  const user = await currentUser();
  if (!user) return null;

  const isVetter = user.role === "admin" || (user.email ?? "").toLowerCase() === "r@rongoldin.com";
  const profileHref = user.role === "recruiter" ? "/settings/search" : "/profile";

  return (
    <SiteNavClient
      userId={user.id}
      photoUrl={user.photo_url}
      profileHref={profileHref}
      isVetter={isVetter}
      waitlisted={onWaitlist(user)}
    />
  );
}
