import Link from "next/link";

import { BrandLogo, LogoHalo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/honesty", label: "Honesty" },
  { href: "/privacy", label: "Privacy" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

export function SiteFooter() {
  return (
    <footer className="relative mt-8 overflow-hidden print:hidden">
      <div aria-hidden="true" className="footer-orb" />
      <div aria-hidden="true" className="hairline pointer-events-none absolute inset-x-0 top-0" />
      <div className="container relative flex flex-col items-center gap-5 py-10 text-center sm:py-12">
        <Link href="/" className="inline-flex items-center gap-2.5 font-semibold tracking-tight">
          <LogoHalo>
            <BrandLogo size={32} />
          </LogoHalo>
          Confuzzle
        </Link>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
          You’re confuzzled about something you’re doing. Confuzzle deciphers it — paste, PDF,
          scan, or import — so you can keep going. Honest to your source. No invented steps.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-2">
          {LINKS.map((link) => (
            <Button
              key={link.href}
              asChild
              variant="outline"
              className="rounded-full border-border bg-card/90 shadow-sm"
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </footer>
  );
}
