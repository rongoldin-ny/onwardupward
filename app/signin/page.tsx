import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import { greeting } from "@/lib/greeting";
import SignInForm from "./SignInForm";

export default async function SignInPage() {
  const user = await currentUser();
  if (user) redirect(homeFor(user));
  return <SignInForm greetingText={greeting()} />;
}
