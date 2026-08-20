import Link from "next/link";

import { BrandLogo } from "@/components/BrandLogo";
import { HomeWorkspace } from "@/components/HomeWorkspace";
import { LandingStory } from "@/components/LandingStory";

const INPUTS = ["Text", "PDF", "Photo", "Link", "Audio"] as const;

export default function HomePage() {
  return (
    <main id="main" className="pb-8">
      <section
        aria-labelledby="hero-heading"
        className="container flex flex-col items-center pt-12 text-center sm:pt-20"
      >
        <div className="animate-fade-up">
          <div className="animate-float">
            <BrandLogo size={92} glow className="rounded-[22%]" />
          </div>
        </div>
        <p className="mt-7 animate-fade-up text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground [animation-delay:80ms]">
          Confuzzle
        </p>
        <h1
          id="hero-heading"
          className="mt-4 max-w-4xl animate-fade-up text-balance text-[2.75rem] font-extrabold leading-[1.03] tracking-[-0.03em] [animation-delay:140ms] sm:text-7xl"
        >
          Make sense of anything.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-pretty text-lg leading-relaxed text-muted-foreground [animation-delay:220ms] sm:text-xl">
          A form. A control panel. A letter that reads like law. Show Confuzzle what is in front of
          you, and get back a version you can act on.
        </p>
        <ul
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
          aria-label="What Confuzzle accepts"
        >
          {INPUTS.map((item, index) => (
            <li
              key={item}
              className="animate-chip-pop rounded-full border border-border/70 bg-background/40 px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/50 hover:text-foreground"
              style={{ animationDelay: `${280 + index * 70}ms` }}
            >
              {item}
            </li>
          ))}
        </ul>
        <Link
          href="/honesty"
          className="mt-5 inline-flex animate-fade-up items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium tracking-wide text-foreground [animation-delay:700ms] hover:border-primary/50"
        >
          Faithful to your source. Always.
        </Link>
      </section>
      <HomeWorkspace />
      <LandingStory />
    </main>
  );
}
