import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import AscentHome from "./AscentHome";

export default async function Landing() {
  const user = await currentUser();
  if (user) redirect(homeFor(user));
  return <AscentHome />;
}
