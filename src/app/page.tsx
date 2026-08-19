import { HomeWorkspace } from "@/components/HomeWorkspace";

export default function HomePage() {
  return (
    <main id="main" className="container py-10 sm:py-16">
      <section aria-labelledby="hero-heading" className="mx-auto max-w-2xl text-center">
        <h1
          id="hero-heading"
          className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl"
        >
          Show it the confusing thing.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
          Get back a version you can follow. We don’t invent safety-critical steps.
        </p>
      </section>
      <HomeWorkspace />
    </main>
  );
}
