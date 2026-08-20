import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPage } from "@/components/MarketingPage";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Honesty",
  description:
    "Confuzzle deciphers your situation. It will not invent safety-critical steps that are not in what you showed it.",
};

export default function HonestyPage() {
  return (
    <MarketingPage
      kicker="Honesty"
      title="We decipher your source. We don’t invent one."
      actions={
        <>
          <Button asChild variant="brand">
            <Link href="/#workspace">Confuzzle this</Link>
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
        You’re confuzzled about something you’re doing. Confuzzle’s job is to make that situation
        followable — not to guess a better one. We stay honest to your source. We will not invent
        safety-critical steps that are not in it.
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>Numbers, quotes, voltages, dosages, and legal outcomes must come from what you showed us.</li>
        <li>Electrical, gas, medical, legal, structural, and height work get a visible caution strip.</li>
        <li>Public http(s) URLs are fetched with SSRF guards. Localhost, private IPs, and credentialed URLs are blocked.</li>
        <li>Imported PDFs yield selectable text. A scanned page is a photo — snap it so visible words can be read.</li>
        <li>
          Photos and scans are sent as pixels. Blurry labels stay unread — we will not guess serials
          or voltages. The image stays in this browser with that result.
        </li>
        <li>Audio is transcribed. We will not invent spoken lines that are not in the transcript.</li>
        <li>Video is not played. Paste a transcript or the part that has you stuck.</li>
        <li>History, ratings, and your display name stay in this browser unless you export them.</li>
        <li>Live Confuzzle needs an OpenAI key on the server. Try a sample works without one.</li>
      </ul>
    </MarketingPage>
  );
}
