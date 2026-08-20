import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPage } from "@/components/MarketingPage";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Honesty",
  description:
    "What Confuzzle will and will not do. Every figure and instruction traces back to your source, and safety-critical work is never invented.",
};

export default function HonestyPage() {
  return (
    <MarketingPage
      kicker="Honesty"
      title="Faithful to your source."
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
        Confuzzle restates what you provide. It does not supply the parts you are missing. Where a
        detail is absent, unreadable, or ambiguous, it says so rather than filling the gap.
      </p>
      <p>The specifics:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>Figures, quotations, voltages, dosages, and legal outcomes come from your source alone.</li>
        <li>Electrical, gas, medical, legal, structural, and height work carries a visible caution.</li>
        <li>Links are fetched with guards in place. Private addresses and credentialed URLs are refused.</li>
        <li>PDFs give up their selectable text. A scanned page is an image — photograph it instead.</li>
        <li>Photographs are read as pixels. An unreadable label stays unread; serial numbers and ratings are never guessed.</li>
        <li>Audio is transcribed verbatim. Nothing is added to a transcript.</li>
        <li>Video is not played. Provide a transcript or the passage in question.</li>
        <li>Your history, ratings, and name remain on this device unless you export them.</li>
        <li>Confuzzle runs on an API key you control. The sample requires no key at all.</li>
      </ul>
    </MarketingPage>
  );
}
