import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Toaster } from "@/components/ui/sonner";
import { WorkspaceProvider } from "@/components/WorkspaceProvider";
import { PRODUCT_BLURB, PRODUCT_NAME } from "@/lib/brand";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["500", "600", "700", "800"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: PRODUCT_NAME,
    template: `%s · ${PRODUCT_NAME}`,
  },
  description: PRODUCT_BLURB,
  applicationName: PRODUCT_NAME,
  icons: {
    apple: "/apple-touch-icon.png",
  },
  keywords: [
    PRODUCT_NAME,
    "Unconfuzzle",
    "explain confusing instructions",
    "step-by-step AI",
    "jargon translator",
    "how-to simplifier",
  ],
  authors: [{ name: PRODUCT_NAME }],
  openGraph: {
    title: PRODUCT_NAME,
    description: PRODUCT_BLURB,
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: PRODUCT_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: PRODUCT_NAME,
    description: PRODUCT_BLURB,
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    title: PRODUCT_NAME,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f8" },
    { media: "(prefers-color-scheme: dark)", color: "#07070a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeBootScript = `(() => {
  try {
    const stored = localStorage.getItem("confuzzled-theme");
    const root = document.documentElement;
    if (stored === "light") {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    } else {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    }
  } catch (error) {}
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} dark`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={`${jakarta.className} min-h-dvh antialiased mesh-bg`} aria-label={PRODUCT_NAME}>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <WorkspaceProvider>
          <div className="flex min-h-dvh flex-col">
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </div>
        </WorkspaceProvider>
        <Toaster />
      </body>
    </html>
  );
}
