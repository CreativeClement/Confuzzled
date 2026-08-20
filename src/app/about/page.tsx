import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPage } from "@/components/MarketingPage";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Confuzzle is a clarity engine for anyone who is stuck. Show it the confusing thing. Get a version you can follow.",
};

export default function AboutPage() {
  return (
    <MarketingPage
      kicker="About"
      title="Confuzzle is for anyone who’s stuck"
      actions={
        <>
          <Button asChild variant="brand">
            <Link href="/#workspace">Unconfuzzle something</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/honesty">How we stay honest</Link>
          </Button>
        </>
      }
    >
      <p>
        Confuzzle is a clarity engine, not a study app. You show it the confusing thing — a wiring
        note, a form, a manual, a messy email, a public URL, a PDF, a photo, an audio clip — and it
        gives you a version you can follow.
      </p>
      <p>
        Electricians, parents, first-timers, professionals, and students get the same deal: we stay
        honest to your source. We do not invent safety-critical steps.
      </p>
      <p>
        One button: Unconfuzzle. Confuzzle picks a lens (steps, plain English, questions, a map, or
        flashcards). You can switch after. Check steps off. If one still doesn’t land, tap stuck and
        we explain only that part.
      </p>
      <p>
        What you Unconfuzzle stays in this browser. There is no cloud account yet. Live Unconfuzzle
        uses OpenAI when a key is configured on the server.
      </p>
    </MarketingPage>
  );
}
