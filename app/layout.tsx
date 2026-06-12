import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-inter-tight",
});

export const metadata: Metadata = {
  title: {
    default: "UXSTARS — Het sterrenstelsel van UX-talent",
    template: "%s — UXSTARS",
  },
  description:
    "UXSTARS is een netwerk van gevouchte UX-designers. Plaats een missie en vind binnen dagen de juiste ster voor je team.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={interTight.variable}>
      <body className="flex min-h-screen flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
