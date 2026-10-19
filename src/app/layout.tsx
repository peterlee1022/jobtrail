import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "jobtrail", template: "%s | jobtrail" },
  description: "Keep track of where you applied and what happened next.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Browser extensions (Grammarly, ColorZilla, password managers...) add
    // attributes to <html> and <body> before React hydrates. This only
    // silences attribute mismatches on these two elements, not their children.
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Nav />
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
