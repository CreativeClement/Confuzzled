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
    <footer className="relative mt-8 border-t border-border/60 print:hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-violet-500/0 via-violet-400/70 to-cyan-400/0"
      />
      <div className="container flex flex-col items-center gap-5 py-10 text-center sm:py-12">
        <Link href="/" className="inline-flex items-center gap-2.5 font-semibold tracking-tight">
          <BrandLogo size={32} />
          Confuzzle
        </Link>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
          You’re confuzzled about something you’re doing. Confuzzle deciphers it — paste, PDF,
          scan, or import — so you can keep going. Honest to your source. No invented steps.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
