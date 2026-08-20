import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPage } from "@/components/MarketingPage";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Confuzzle is for people who are confuzzled about something they are doing. Show it the problem. Get a version you can follow.",
};

export default function AboutPage() {
  return (
    <MarketingPage
      kicker="About"
      title="For people who are confuzzled"
      actions={
        <>
          <Button asChild variant="brand">
            <Link href="/#workspace">Confuzzle this</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/honesty">How we stay honest</Link>
          </Button>
        </>
      }
    >
      <p>
        Confuzzle is a tool for when you’re in the middle of something and it doesn’t make sense. A
        wiring note. A form. A manual. A messy email. A scanned page. You show it the problematic
        situation — copy-paste, import a PDF, snap a scan — and it deciphers the confusion so you
        can actually do the next step.
      </p>
      <p>
        The people who show up here are confuzzled. The point of Confuzzle is that they don’t stay
        that way. Electricians, parents, first-timers, professionals, students — if you’re lost in
        the work, you’re in the right place.
      </p>
      <p>
        One button: Confuzzle this. Confuzzle picks a lens (steps, plain English, questions, a map, or
        flashcards). You can switch after. Check steps off. If one still doesn’t land, tap stuck and
        we explain only that part from your source.
      </p>
      <p>
        We stay honest to what you showed us. We do not invent safety-critical steps. Results stay
        in this browser. There is no cloud account yet. Live Confuzzle uses OpenAI when a key is
        configured on the server.
      </p>
    </MarketingPage>
  );
}
