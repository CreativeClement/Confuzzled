import Link from "next/link";

import { BrandLogo, LogoHalo } from "@/components/BrandLogo";
import { HomeWorkspace } from "@/components/HomeWorkspace";
import { LandingStory } from "@/components/LandingStory";

const PROOF = ["Paste", "Scan", "PDF", "Import", "URL", "Audio"] as const;

export default function HomePage() {
  return (
    <main id="main" className="pb-8">
      <section
        aria-labelledby="hero-heading"
        className="container flex flex-col items-center pt-10 text-center sm:pt-16"
      >
        <LogoHalo>
          <BrandLogo size={88} className="rounded-[22%]" />
        </LogoHalo>
        <p className="kicker mt-6">
          <span className="pulse-dot" aria-hidden="true" />
          Confuzzle
        </p>
        <h1
          id="hero-heading"
          className="mt-3 max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-6xl sm:leading-[1.05]"
        >
          You’re confuzzled. Show it the problem.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
          You’re in the middle of something and it doesn’t make sense. Paste it, import a PDF, or
          scan the page. Confuzzle deciphers it so you can keep going — and you’re no longer
          confuzzled.
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-label="How you can show Confuzzle the problem">
          {PROOF.map((item) => (
            <li key={item} className="proof-chip">
              {item}
            </li>
          ))}
        </ul>
        <Link
          href="/honesty"
          className="mt-4 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground hover:border-primary/50"
        >
          We decipher your source. We don’t invent one.
        </Link>
      </section>
      <HomeWorkspace />
      <LandingStory />
    </main>
  );
}
