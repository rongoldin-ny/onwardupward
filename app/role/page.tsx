import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import RoleSelect from "./RoleSelect";

export default async function RolePage() {
  const user = await currentUser();
  if (!user) redirect("/signup");
  if (user.onboarding_complete) redirect(homeFor(user));
  return <RoleSelect />;
}
