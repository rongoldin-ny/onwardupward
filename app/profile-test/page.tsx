import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import ProfileTestLab from "./ProfileTestLab";

// The Claude call can take a while; give the action time to finish.
export const maxDuration = 60;

/** Secret AI-fill test lab — allowlisted accounts only, nothing persists. */
export default async function ProfileTestPage() {
  const user = await requireUser();
  const allowed =
    (user.email ?? "").toLowerCase() === "r@rongoldin.com" ||
    process.env.NODE_ENV !== "production";
  if (!allowed) notFound();
  return <ProfileTestLab />;
}
