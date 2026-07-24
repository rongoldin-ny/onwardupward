import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import AscentHome from "./AscentHome";

export default async function Landing({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // ?preview=1 shows the signed-out landing even while logged in.
  const { preview } = await searchParams;
  if (preview !== "1") {
    const user = await currentUser();
    if (user) redirect(homeFor(user));
  }
  return <AscentHome />;
}
