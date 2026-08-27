import Link from "next/link";

import { BrandLogo } from "@/components/BrandLogo";
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
        <div className="logo-halo fade-up">
          <BrandLogo size={88} glow className="relative z-[1] animate-float-soft rounded-[22%]" />
        </div>
        <p className="kicker fade-up fade-up-delay-1 mt-6">Confuzzle</p>
        <h1
          id="hero-heading"
          className="fade-up fade-up-delay-2 mt-3 max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-6xl sm:leading-[1.05]"
        >
          You’re <span className="text-gradient">confuzzled</span>. Show it the problem.
        </h1>
        <p className="fade-up fade-up-delay-3 mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
          You’re in the middle of something and it doesn’t make sense. Paste it, import a PDF, or
          scan the page. Confuzzle deciphers it so you can keep going — and you’re no longer
          confuzzled.
        </p>
        <ul
          className="fade-up fade-up-delay-4 mt-6 flex flex-wrap items-center justify-center gap-2"
          aria-label="How you can show Confuzzle the problem"
        >
          {PROOF.map((item) => (
            <li
              key={item}
              className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/50 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm"
            >
              <span aria-hidden="true" className="pulse-dot" />
              {item}
            </li>
          ))}
        </ul>
        <Link
          href="/honesty"
          className="fade-up fade-up-delay-4 mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground shadow-[0_0_24px_-8px_hsl(266_90%_55%/0.6)] hover:border-primary/50"
        >
          <span aria-hidden="true" className="pulse-dot" />
          We decipher your source. We don’t invent one.
        </Link>
      </section>
      <HomeWorkspace />
      <LandingStory />
    </main>
  );
}
