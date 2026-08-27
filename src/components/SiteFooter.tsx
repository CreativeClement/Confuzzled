import Link from "next/link";

import { BrandLogo } from "@/components/BrandLogo";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/honesty", label: "Honesty" },
  { href: "/privacy", label: "Privacy" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

export function SiteFooter() {
  return (
    <footer className="relative mt-8 print:hidden">
      <div className="container pb-8 pt-2">
        <div className="footer-orb relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/40 px-6 py-10 text-center shadow-sm backdrop-blur-xl sm:px-10 sm:py-12">
          <div aria-hidden="true" className="hairline-gradient absolute inset-x-0 top-0" />
          <Link href="/" className="relative inline-flex items-center gap-2.5 font-semibold tracking-tight">
            <BrandLogo size={32} />
            Confuzzle
          </Link>
          <p className="relative mx-auto mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground">
            You’re confuzzled about something you’re doing. Confuzzle deciphers it — paste, PDF,
            scan, or import — so you can keep going. Honest to your source. No invented steps.
          </p>
          <nav aria-label="Footer" className="relative mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-border/70 bg-background/40 px-3.5 py-1.5 text-muted-foreground underline-offset-4 transition-colors hover:border-primary/30 hover:text-foreground hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
