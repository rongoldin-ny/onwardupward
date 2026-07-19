import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import { greeting } from "@/lib/greeting";
import SignUpForm from "./SignUpForm";

export default async function SignUpPage() {
  const user = await currentUser();
  if (user) redirect(homeFor(user));
  return <SignUpForm greetingText={greeting()} />;
}
