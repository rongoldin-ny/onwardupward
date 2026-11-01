import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { Logo, PageFrame } from "@/components/ui";
import ResetForm from "./ResetForm";

export const metadata = { title: "Set a new password — onward/upward" };

export default async function ResetPasswordPage() {
  // currentUser, not requireUser: a waitlisted account can reset its password
  // too, and requireUser would sign it out before it got the chance.
  const user = await currentUser();
  if (!user) redirect("/forgot-password");

  return (
    <PageFrame size="narrow" chromeLogo={false} centered>
      <div className="flex flex-1 flex-col px-7 pt-8 pb-8 text-center">
        <main className="flex flex-1 flex-col justify-center">
          <span className="self-center">
            <Logo />
          </span>

          <h1 className="mt-9 text-[34px] leading-[1.08] font-black tracking-[-0.02em] text-cream">
            Set a new password.
          </h1>

          <ResetForm />
        </main>
      </div>
    </PageFrame>
  );
}
