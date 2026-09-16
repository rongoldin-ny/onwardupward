import { requireVetter } from "@/lib/vetting";
import { productUpdateAudience } from "@/lib/notifications";
import { Logo, PageFrame } from "@/components/ui";
import AdminTabs from "../AdminTabs";
import BroadcastForm from "./BroadcastForm";

export const metadata = { title: "Broadcast — onward/upward" };

export default async function BroadcastPage() {
  await requireVetter();
  const audience = await productUpdateAudience();

  return (
    <PageFrame size="narrow">
      <div className="flex flex-1 flex-col px-7 pt-8 pb-10">
        <header>
          <span className="md:hidden">
            <Logo />
          </span>
        </header>
        <main>
          <AdminTabs />
          <h1 className="mt-8 text-[30px] leading-[1.1] font-black tracking-[-0.02em] text-cream">
            Product update.
          </h1>
          <p className="mt-3 text-[15px] leading-[1.5] text-secondary">
            Goes to every member who hasn&apos;t muted product updates in their notification
            settings. Members who muted them are skipped automatically.
          </p>
          <BroadcastForm audience={audience} />
        </main>
      </div>
    </PageFrame>
  );
}
