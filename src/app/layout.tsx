import type { Metadata, Viewport } from "next";
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
    default: "Confuzzled — Universal AI Clarity Engine",
    template: "%s · Confuzzled",
  },
  description:
    "Unconfuzzle anything. For every human who’s stuck — instructions, manuals, wiring notes, forms, emails, videos. Get a TL;DR, step-by-step, plain-English explanation, visual map, or flashcards.",
  applicationName: "Confuzzled",
  keywords: [
    "AI clarity engine",
    "explain confusing instructions",
    "step-by-step AI",
    "jargon translator",
    "how-to simplifier",
  ],
  authors: [{ name: "Confuzzled" }],
  openGraph: {
    title: "Confuzzled — Universal AI Clarity Engine",
    description:
      "Stuck on instructions, a job, or a wall of text? Paste it. Get a version you can actually follow.",
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Confuzzled",
  },
  twitter: {
    card: "summary",
    title: "Confuzzled — Universal AI Clarity Engine",
    description:
      "A universal AI clarity engine for anyone who’s confused — from manuals to job-site notes.",
  },
  robots: {
    index: true,
    follow: true,
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
        aria-label="Confuzzled, a clarity engine for anyone who is confused"
      >
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <WorkspaceProvider>
          <div className="flex min-h-dvh flex-col">
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <footer className="border-t border-border/70 py-8 text-center text-sm text-muted-foreground">
              <p>
                For anyone stuck on instructions, a job, or a wall of text. We keep the source honest —
                no invented quotes, numbers, or steps.
              </p>
            </footer>
          </div>
        </WorkspaceProvider>
        <Toaster />
      </body>
    </html>
  );
}
