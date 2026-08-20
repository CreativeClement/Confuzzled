import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPage } from "@/components/MarketingPage";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Confuzzle is a clarity engine for the moment you are stuck. Show it what is in front of you and get back a version you can act on.",
};

export default function AboutPage() {
  return (
    <MarketingPage
      kicker="About"
      title="For the moment you’re stuck."
      actions={
        <>
          <Button asChild variant="brand">
            <Link href="/#workspace">Confuzzle this</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/honesty">Our commitments</Link>
          </Button>
        </>
      }
    >
      <p>
        Everyone meets it eventually. A wiring diagram. A benefits form. A manual written for
        somebody else. The information is all there, and none of it is usable.
      </p>
      <p>
        Confuzzle closes that gap. Show it the page — paste the text, import a PDF, photograph the
        panel — and it returns the same information in a form you can act on. Steps you can follow.
        Plain language instead of jargon. A map when the pieces matter more than the order.
      </p>
      <p>
        This is not a study tool. Electricians, carers, first-timers, and professionals arrive with
        the same problem and leave with the same thing: the next move, clearly stated.
      </p>
      <p>
        One control does the work. Confuzzle selects the lens it judges best, and you are free to
        change it. Work through the result line by line. Anything that still doesn’t land gets
        explained on its own, drawn only from what you provided.
      </p>
      <p>
        Confuzzle runs on an API key you control and keeps your work on your device. There is no
        account and nothing to sign up for.
      </p>
    </MarketingPage>
  );
}
