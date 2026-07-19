import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import ResetForm from "./ResetForm";

export default async function ResetPasswordPage() {
  // Recovery links sign the user in via /auth/confirm before landing here.
  const user = await currentUser();
  if (!user) redirect("/forgot-password");
  return <ResetForm />;
}
