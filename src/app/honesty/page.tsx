import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPage } from "@/components/MarketingPage";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Honesty",
  description:
    "What Confuzzled will and will not do: no invented safety-critical steps, public URL fetch with guards, local history, photos read as pixels.",
};

export default function HonestyPage() {
  return (
    <MarketingPage
      kicker="Honesty"
      title="We keep the source honest"
      actions={
        <>
          <Button asChild variant="brand">
            <Link href="/#workspace">Unconfuzzle something</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/about">About</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/privacy">Privacy</Link>
          </Button>
        </>
      }
    >
      <p>
        The product sentence: show Confuzzled the confusing thing. Get back a version you can follow,
        that does not invent safety-critical steps.
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>Numbers, quotes, voltages, dosages, and legal outcomes must come from your source.</li>
        <li>Electrical, gas, medical, legal, structural, and height work get a visible caution strip.</li>
        <li>Public http(s) URLs are fetched with SSRF guards. Localhost, private IPs, and credentialed URLs are blocked.</li>
        <li>PDFs yield selectable text only. Scanned pages still need you to type what you can read.</li>
        <li>
          Photos are sent as pixels so visible words can be read. Blurry labels stay unread — we
          will not guess serials or voltages. The photo stays in this browser with that
          clarification.
        </li>
        <li>Audio is transcribed. We will not invent spoken lines that are not in the transcript.</li>
        <li>Video is not played. Paste a transcript or the part that has you stuck.</li>
        <li>History, ratings, and your display name stay in this browser unless you export them.</li>
        <li>Live Unconfuzzle needs an OpenAI key on the server. Try a sample works without one.</li>
      </ul>
    </MarketingPage>
  );
}
