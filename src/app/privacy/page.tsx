import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPage } from "@/components/MarketingPage";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "Your work stays on your device. Confuzzle has no account, stores no API key, and keeps nothing you send.",
};

export default function PrivacyPage() {
  return (
    <MarketingPage
      kicker="Privacy"
      title="Your work stays yours."
      actions={
        <>
          <Button asChild variant="brand">
            <Link href="/#workspace">Confuzzle this</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/honesty">Honesty</Link>
          </Button>
        </>
      }
    >
      <p>
        Confuzzle has no account. Your name, history, ratings, drafts, and photographs live in this
        browser and nowhere else. Export them when you want a copy; photographs are deliberately
        left out of that file.
      </p>
      <p>
        The API key is yours. You add it once, it is held in this browser, and it travels with each
        request so your provider will answer. We never write it to our storage or our logs.
      </p>
      <p>
        When you tap Confuzzle this, what you provided passes through our server to the provider you
        chose, and the answer comes back. We do not train on it. We do not sell it. We do not keep
        it.
      </p>
      <p>
        A link you paste may be fetched by our server so the page can be read. Private networks,
        internal addresses, and URLs carrying credentials are refused.
      </p>
      <p>
        On a shared device, treat this like any other browser tab: avoid pasting secrets or another
        person’s private information. Clearing site data, or Reset in Settings, removes everything
        Confuzzle holds.
      </p>
      <p>
        See{" "}
        <Link href="/honesty" className="text-foreground underline underline-offset-4">
          Honesty
        </Link>{" "}
        for the limits on what the model is permitted to say.
      </p>
    </MarketingPage>
  );
}
