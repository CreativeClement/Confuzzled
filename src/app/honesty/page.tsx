import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPage } from "@/components/MarketingPage";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Honesty",
  description:
    "What Confuzzle will and will not do: no invented safety-critical steps, guarded URL fetch, local history, photos read as pixels.",
};

export default function HonestyPage() {
  return (
    <MarketingPage
      kicker="Honesty"
      title="Confuzzle stays honest to your source"
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
        Show Confuzzle the confusing thing. Get a version you can follow. We will not invent
        safety-critical steps that are not in your source.
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>Numbers, quotes, voltages, dosages, and legal outcomes must come from what you showed us.</li>
        <li>Electrical, gas, medical, legal, structural, and height work get a visible caution strip.</li>
        <li>Public http(s) URLs are fetched with SSRF guards. Localhost, private IPs, and credentialed URLs are blocked.</li>
        <li>PDFs yield selectable text only. Scanned pages still need you to type what you can read.</li>
        <li>
          Photos are sent as pixels so visible words can be read. Blurry labels stay unread — we
          will not guess serials or voltages. The photo stays in this browser with that result.
        </li>
        <li>Audio is transcribed. We will not invent spoken lines that are not in the transcript.</li>
        <li>Video is not played. Paste a transcript or the part that has you stuck.</li>
        <li>History, ratings, and your display name stay in this browser unless you export them.</li>
        <li>Live Unconfuzzle needs an OpenAI key on the server. Try a sample works without one.</li>
      </ul>
    </MarketingPage>
  );
}
