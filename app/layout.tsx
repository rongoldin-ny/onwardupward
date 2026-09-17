import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import PageViewTracker from "@/components/PageViewTracker";
import { currentUser } from "@/lib/auth";
import SiteNav from "@/components/nav/SiteNav";
import SiteFooter from "@/components/nav/SiteFooter";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "Onward/Upward - a growth network for people in tech.",
  description: "Vetted product designers and PMs, found by taste — not keywords.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Memoized per request (lib/auth), so this costs nothing on top of SiteNav's
  // own lookup. The footer needs it to keep Feedback/Help off signed-out pages.
  const user = await currentUser();
  return (
    <html lang="en" className={`${schibsted.variable} h-full antialiased`}>
      <body className="min-h-full bg-page">
        <PageViewTracker />
        <SiteNav />
        {children}
        <SiteFooter signedIn={!!user} />
      </body>
    </html>
  );
}
