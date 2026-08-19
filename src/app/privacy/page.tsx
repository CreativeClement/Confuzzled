import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What Confuzzled sends to OpenAI, what stays in this browser, and what we never invent.",
};

export default function PrivacyPage() {
  return (
    <main id="main" className="container max-w-2xl py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Privacy</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">What stays here</h1>
      <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
        <p>
          Confuzzled has no cloud account. Your display name, history, ratings, drafts, and photos
          stay in this browser unless you export a JSON backup. Photos are not inside that JSON file.
        </p>
        <p>
          When you click Unconfuzzle, the source you pasted (and a photo or audio transcript, if you
          attached one) is sent to the Confuzzled server, then to OpenAI to produce the clear version.
          We do not use it to train a Confuzzled model. We do not sell it.
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
          See <Link href="/honesty" className="underline underline-offset-4">Honesty</Link> for what
          the model is allowed to invent — nothing safety-critical that is not in your source.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/#workspace">Unconfuzzle something</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/honesty">Honesty</Link>
        </Button>
      </div>
    </main>
  );
}
