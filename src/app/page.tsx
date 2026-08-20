import Link from "next/link";

import { BrandLogo } from "@/components/BrandLogo";
import { HomeWorkspace } from "@/components/HomeWorkspace";
import { LandingStory } from "@/components/LandingStory";

const PROOF = ["Paste", "Photo", "URL", "PDF", "Audio"] as const;

export default function HomePage() {
  return (
    <main id="main" className="pb-8">
      <section
        aria-labelledby="hero-heading"
        className="container flex flex-col items-center pt-10 text-center sm:pt-16"
      >
        <BrandLogo size={88} glow className="rounded-[22%]" />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Confuzzle
        </p>
        <h1
          id="hero-heading"
          className="mt-3 max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-6xl sm:leading-[1.05]"
        >
          Show it the confusing thing.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
          Confuzzle hands back a version you can follow. It will not invent voltages, dosages, or
          other safety-critical steps.
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-label="What you can drop in">
          {PROOF.map((item) => (
            <li
              key={item}
              className="rounded-full border border-border/80 bg-background/40 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm"
            >
              {item}
            </li>
          ))}
        </ul>
        <Link
          href="/honesty"
          className="mt-4 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground hover:border-primary/50"
        >
          Honest to your source
        </Link>
      </section>
      <HomeWorkspace />
      <LandingStory />
    </main>
  );
}
