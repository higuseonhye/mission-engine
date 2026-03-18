import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Mission Engine",
  description:
    "Agent-first. Discover missions, spawn companies, build the future. Infrastructure · Agents · Applications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} font-sans antialiased min-h-screen`}
      >
        <header className="border-b border-[var(--border)]">
          <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
            <Link href="/" className="font-semibold text-white hover:text-[var(--accent)]">
              Mission Engine
            </Link>
            <nav className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
              <Link href="/" className="hover:text-white">Ecosystem</Link>
              <Link href="/worldview" className="hover:text-white">Worldview</Link>
              <Link href="/missions/manage" className="hover:text-white">Missions</Link>
              <Link href="/map" className="hover:text-white">Map</Link>
              <Link href="/companies" className="hover:text-white">Companies</Link>
              <Link href="/blocks" className="hover:text-white">Blocks</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
