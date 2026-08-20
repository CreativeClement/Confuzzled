const STEPS = [
  {
    n: "01",
    title: "Show it anything.",
    body: "Paste the text, import a PDF, or photograph the page. Links and voice notes work the same way.",
  },
  {
    n: "02",
    title: "One tap.",
    body: "Confuzzle chooses the right lens — steps, plain language, questions, a map, or cards. Change it whenever you like.",
  },
  {
    n: "03",
    title: "Act with confidence.",
    body: "Work through it line by line. Anything that still doesn’t land gets explained on its own, from your source.",
  },
] as const;

const PRINCIPLES = [
  {
    title: "Nothing invented.",
    body: "Every figure, quote, and instruction traces back to what you provided. Safety-critical work is flagged, never guessed.",
  },
  {
    title: "Yours alone.",
    body: "Your history, drafts, and photographs stay on your device. There is no account, and nothing to sign up for.",
  },
  {
    title: "Your own key.",
    body: "Confuzzle runs on an API key you control, passed straight to the provider you choose. We never store it.",
  },
] as const;

export function LandingStory() {
  return (
    <>
      <section
        aria-labelledby="story-heading"
        className="mx-auto mt-24 max-w-5xl px-4 sm:mt-32 sm:px-6"
      >
        <p className="animate-fade-up text-center text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">
          How it works
        </p>
        <h2
          id="story-heading"
          className="mt-3 animate-fade-up text-balance text-center text-3xl font-bold tracking-[-0.02em] [animation-delay:80ms] sm:text-4xl"
        >
          Three steps. That’s the whole thing.
        </h2>
        <ol className="mt-12 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.n}
              className="story-card animate-fade-up rounded-[1.75rem] border border-border/70 bg-card/50 p-7 shadow-sm backdrop-blur-sm"
              style={{ animationDelay: `${120 + index * 120}ms` }}
            >
              <p className="bg-gradient-to-r from-violet-700 to-cyan-700 bg-clip-text text-sm font-bold tracking-widest text-transparent dark:from-violet-400 dark:to-cyan-300">
                {step.n}
              </p>
              <h3 className="mt-4 text-xl font-semibold tracking-[-0.01em]">{step.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="principles-heading"
        className="mx-auto mt-24 max-w-5xl px-4 pb-8 sm:mt-32 sm:px-6"
      >
        <h2
          id="principles-heading"
          className="text-balance text-center text-3xl font-bold tracking-[-0.02em] sm:text-4xl"
        >
          Built on three commitments.
        </h2>
        <dl className="mt-12 grid gap-10 sm:grid-cols-3">
          {PRINCIPLES.map((principle) => (
            <div key={principle.title}>
              <dt className="text-lg font-semibold tracking-[-0.01em]">{principle.title}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{principle.body}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
