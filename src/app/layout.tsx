import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { ThemeToggle } from "@/components/ThemeToggle";

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
    "Unconfuzzle anything. Paste dense text, a URL, or messy notes and get a TL;DR, Feynman explanation, Socratic dialogue, visual map, or flashcards.",
  applicationName: "Confuzzled",
  keywords: [
    "AI summarizer",
    "Feynman technique",
    "flashcards",
    "explain like I'm 12",
    "clarity engine",
  ],
  authors: [{ name: "Confuzzled" }],
  openGraph: {
    title: "Confuzzled — Universal AI Clarity Engine",
    description:
      "Paste the muddle. Choose a lens. Get a version you can actually use.",
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Confuzzled",
  },
  twitter: {
    card: "summary",
    title: "Confuzzled — Universal AI Clarity Engine",
    description: "A universal AI clarity engine for dense text, talks, and tangled notes.",
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
        aria-label="Confuzzled, a universal AI clarity engine"
      >
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <div className="flex min-h-dvh flex-col">
          <header className="border-b border-border/70 bg-background/80 backdrop-blur-md">
            <div className="container flex min-h-16 items-center justify-between gap-3 py-3">
              <a href="#main" className="flex min-h-12 items-center gap-2 font-semibold tracking-tight">
                <span
                  aria-hidden="true"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm text-primary-foreground"
                >
                  Cz
                </span>
                <span>
                  Confuzzled
                  <span className="ml-2 hidden text-xs font-normal text-muted-foreground sm:inline">
                    clarity engine
                  </span>
                </span>
              </a>
              <ThemeToggle />
            </div>
          </header>
          <div className="flex-1">{children}</div>
          <footer className="border-t border-border/70 py-8 text-center text-sm text-muted-foreground">
            <p>Confuzzled keeps the source honest. It will not invent quotes, numbers, or steps.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
