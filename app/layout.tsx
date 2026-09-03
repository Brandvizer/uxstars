import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import SiteChrome from "@/components/layout/SiteChrome";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-inter-tight",
});

export const metadata: Metadata = {
  title: {
    default: "UXSTARS | Het sterrenstelsel van digital designers",
    template: "%s | UXSTARS",
  },
  description:
    "UXSTARS is een netwerk van gevouchte digital designers: UX, UI, product, service en visual. Plaats een missie en vind binnen dagen de juiste ster voor je team.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={interTight.variable}>
      <body className="flex min-h-screen flex-col">
        <SiteChrome nav={<Nav />} footer={<Footer />}>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
