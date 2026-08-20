const STEPS = [
  {
    n: "01",
    title: "Show Confuzzle the confusing thing",
    body: "Paste the words, drop a PDF, snap a photo, or send a public URL. Audio notes work too.",
  },
  {
    n: "02",
    title: "Tap Unconfuzzle",
    body: "Confuzzle picks a lens — steps, plain English, questions, a map, or flashcards. You can switch after.",
  },
  {
    n: "03",
    title: "Follow the clear version",
    body: "Check steps off. If one still doesn’t land, tap stuck and we explain only that part from your source.",
  },
] as const;

export function LandingStory() {
  return (
    <section
      aria-labelledby="story-heading"
      className="mx-auto mt-20 max-w-5xl px-4 pb-8 sm:mt-24 sm:px-6"
    >
      <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        How it works
      </p>
      <h2 id="story-heading" className="mt-2 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
        Confused in. Clear out.
      </h2>
      <ol className="mt-10 grid gap-4 sm:grid-cols-3">
        {STEPS.map((step) => (
          <li
            key={step.n}
            className="rounded-[1.75rem] border border-border/70 bg-card/50 p-6 shadow-sm backdrop-blur-sm"
          >
            <p className="bg-gradient-to-r from-violet-700 to-cyan-700 bg-clip-text text-sm font-bold tracking-widest text-transparent dark:from-violet-400 dark:to-cyan-300">
              {step.n}
            </p>
            <h3 className="mt-3 text-lg font-semibold tracking-tight">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
