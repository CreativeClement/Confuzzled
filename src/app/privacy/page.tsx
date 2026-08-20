import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPage } from "@/components/MarketingPage";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What Confuzzle sends to OpenAI when you Unconfuzzle a problem, and what stays in this browser.",
};

export default function PrivacyPage() {
  return (
    <MarketingPage
      kicker="Privacy"
      title="What stays on this device"
      actions={
        <>
          <Button asChild variant="brand">
            <Link href="/#workspace">Unconfuzzle something</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/honesty">Honesty</Link>
          </Button>
        </>
      }
    >
      <p>
        Confuzzle has no cloud account. Your display name, history, ratings, drafts, and photos
        stay in this browser unless you export a JSON backup. Photos are not inside that JSON file.
      </p>
      <p>
        When you tap Unconfuzzle, the problem you showed us (a paste, an imported PDF, a scan, or an
        audio transcript) goes to the Confuzzle server, then to OpenAI to decipher. We do not use it
        to train a Confuzzle model. We do not sell it.
      </p>
      <p>
        Public URLs you paste may be fetched by our server so we can read the page. Localhost,
        private networks, and URLs with passwords are blocked.
      </p>
      <p>
        Do not paste secrets, passwords, or other people’s private data on a shared device. Clearing
        this site’s data in the browser, or Reset in Settings, removes the local workspace.
      </p>
      <p>
        See{" "}
        <Link href="/honesty" className="text-foreground underline underline-offset-4">
          Honesty
        </Link>{" "}
        for what the model is allowed to invent — nothing safety-critical that is not in your source.
      </p>
    </MarketingPage>
  );
}
