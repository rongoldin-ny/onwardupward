import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import PageViewTracker from "@/components/PageViewTracker";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "onward/upward — A private talent network",
  description: "Vetted product designers and PMs, found by taste — not keywords.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${schibsted.variable} h-full antialiased`}>
      <body className="min-h-full bg-page">
        <PageViewTracker />
        {children}
      </body>
    </html>
  );
}
