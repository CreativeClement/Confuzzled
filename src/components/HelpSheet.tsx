"use client";

import { CircleHelp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const LENSES = [
  { name: "Summary", detail: "What this actually says." },
  { name: "Steps", detail: "Do this, then this." },
  { name: "Plain language", detail: "The same thing, without the jargon." },
  { name: "Questions", detail: "Three prompts that get you unstuck." },
  { name: "Map", detail: "How the pieces connect." },
  { name: "Cards", detail: "The parts worth remembering." },
] as const;

export function HelpSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="icon" aria-label="How Confuzzle works">
          <CircleHelp aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>How Confuzzle works</SheetTitle>
          <SheetDescription>
            Show it what is in front of you. Get back a version you can act on.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-5 text-sm leading-relaxed">
          <p>
            Paste the text, import a PDF, photograph the page, or drop in a link. Tap Confuzzle this.
            The result arrives as it is written, and you can change the lens at any point.
          </p>
          <div>
            <p className="font-medium text-foreground">Six lenses</p>
            <ul className="mt-2 space-y-1.5">
              {LENSES.map((lens) => (
                <li key={lens.name}>
                  <span className="font-medium text-foreground">{lens.name}</span>
                  <span className="text-muted-foreground"> — {lens.detail}</span>
                </li>
              ))}
            </ul>
          </div>
          <p>
            Work through the result line by line. If one part still doesn’t land, tap it and that
            part alone is explained, drawn only from your source.
          </p>
          <p className="text-muted-foreground">
            A photograph is read for the words visible in it. Audio is transcribed. Video is not
            played — provide the passage instead. An unreadable label stays unread.
          </p>
          <p className="text-muted-foreground">
            Every result is kept in this browser. Open the dashboard to rate it, pin it, or set a
            preferred lens.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
