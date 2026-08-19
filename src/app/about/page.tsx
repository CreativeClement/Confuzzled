import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Confuzzled is a clarity engine for anyone who is stuck — not a study app. Paste the confusing thing and get a version you can follow.",
};

export default function AboutPage() {
  return (
    <main id="main" className="container max-w-2xl py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">About</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">For anyone who’s stuck</h1>
      <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
        <p>
          Confuzzled is a universal AI clarity engine. Show it the confusing thing — a wiring note, a
          form, a manual, a messy email, a public URL, a PDF, a photo — and get back a version you can
          follow.
        </p>
        <p>
          It is not a study-only app. Electricians, parents, first-timers, professionals, and students
          all get the same promise: we stay honest to your source and do not invent safety-critical
          steps.
        </p>
        <p>
          One button. Confuzzled picks a lens (steps, plain English, questions, a map, or flashcards).
          You can switch after. Check steps off. If one still doesn’t land, tap stuck and we explain
          only that part.
        </p>
        <p>
          Clarifications stay in this browser. There is no cloud account yet. Live Unconfuzzle uses
          OpenAI when a key is configured on the server.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/#workspace">Unconfuzzle something</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/honesty">How we stay honest</Link>
        </Button>
      </div>
    </main>
  );
}
