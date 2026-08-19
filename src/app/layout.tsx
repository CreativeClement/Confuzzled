import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";

import { SiteHeader } from "@/components/SiteHeader";
import { Toaster } from "@/components/ui/sonner";
import { WorkspaceProvider } from "@/components/WorkspaceProvider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Confuzzled",
    template: "%s · Confuzzled",
  },
  description:
    "Show Confuzzled the confusing thing. Get back a version you can follow, that does not invent safety-critical steps.",
  applicationName: "Confuzzled",
  keywords: [
    "Confuzzled",
    "Unconfuzzle",
    "explain confusing instructions",
    "step-by-step AI",
    "jargon translator",
    "how-to simplifier",
  ],
  authors: [{ name: "Confuzzled" }],
  openGraph: {
    title: "Confuzzled",
    description:
      "Show Confuzzled the confusing thing. Get back a version you can follow, that does not invent safety-critical steps.",
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Confuzzled",
  },
  twitter: {
    card: "summary",
    title: "Confuzzled",
    description:
      "Show Confuzzled the confusing thing. Get back a version you can follow, that does not invent safety-critical steps.",
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    title: "Confuzzled",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#101018" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeBootScript = `(() => {
  try {
    const stored = localStorage.getItem("confuzzled-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored === "light" || stored === "dark" ? stored : prefersDark ? "dark" : "light";
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    root.style.colorScheme = theme;
  } catch (error) {}
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body
        className={`${inter.className} min-h-dvh antialiased mesh-bg`}
        aria-label="Confuzzled"
      >
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <WorkspaceProvider>
          <div className="flex min-h-dvh flex-col">
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <footer className="border-t border-border/70 py-8 text-center text-sm text-muted-foreground print:hidden">
              <p>
                For anyone stuck on instructions, a job, or a wall of text. We keep the source honest —
                no invented quotes, numbers, or steps.
              </p>
              <nav aria-label="Footer" className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <Link href="/about" className="underline-offset-4 hover:underline">
                  About
                </Link>
                <Link href="/honesty" className="underline-offset-4 hover:underline">
                  Honesty
                </Link>
                <Link href="/dashboard" className="underline-offset-4 hover:underline">
                  Dashboard
                </Link>
              </nav>
            </footer>
          </div>
        </WorkspaceProvider>
        <Toaster />
      </body>
    </html>
  );
}
