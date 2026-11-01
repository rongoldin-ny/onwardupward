import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import { getCoachByProfileId } from "@/lib/coaches-db";
import RoleSelect, { type RoleChoice } from "./RoleSelect";

export default async function RolePage() {
  const user = await currentUser();
  if (!user) redirect("/signup");
  if (user.onboarding_complete) redirect(homeFor(user));

  // Coming back from step 1 of onboarding, their earlier picks are preselected.
  let initial: RoleChoice[] = [];
  if (user.role === "coach") initial = ["coach"];
  else if (user.role_chosen) {
    initial = (await getCoachByProfileId(user.id)) ? ["candidate", "coach"] : ["candidate"];
  }
  return <RoleSelect initial={initial} />;
}
