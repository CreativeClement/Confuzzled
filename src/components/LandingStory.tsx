const STEPS = [
  {
    n: "01",
    title: "You’re confuzzled about something you’re doing",
    body: "A form, a panel, a manual, a letter, a job that won’t click. That’s the moment Confuzzle is for.",
  },
  {
    n: "02",
    title: "Show it the problematic situation",
    body: "Copy-paste the words, import a PDF, scan or photograph the page, or drop a public URL. Audio notes work too.",
  },
  {
    n: "03",
    title: "Tap Confuzzle this — then keep going",
    body: "Confuzzle deciphers the mess into steps, plain English, questions, a map, or flashcards. Check them off. If one still doesn’t land, tap stuck.",
  },
] as const;

export function LandingStory() {
  return (
    <section
      aria-labelledby="story-heading"
      className="mx-auto mt-20 max-w-5xl px-4 pb-8 sm:mt-24 sm:px-6"
    >
      <p className="animate-fade-up text-center text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        How it works
      </p>
      <h2 id="story-heading" className="mt-2 animate-fade-up text-center text-2xl font-semibold tracking-tight [animation-delay:80ms] sm:text-3xl">
        Confuzzled in. Clear enough to act.
      </h2>
      <ol className="mt-10 grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li
            key={step.n}
            className="story-card animate-fade-up rounded-[1.75rem] border border-border/70 bg-card/50 p-6 shadow-sm backdrop-blur-sm"
            style={{ animationDelay: `${120 + index * 120}ms` }}
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
