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

export function HelpSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="icon" aria-label="Who Confuzzled is for">
          <CircleHelp aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>For anyone who’s stuck</SheetTitle>
          <SheetDescription>
            Confuzzled is not a study app. It’s a clarity engine for any human who’s confused about
            something they have to deal with.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4 text-sm leading-relaxed">
          <p>
            Drop the confusing thing. One button. Confuzzled picks the lens — steps, plain English,
            questions, a map, or flashcards — and you can switch after. Check steps off. If a step
            still doesn’t land, tap stuck and we explain only that part from your source. The clear
            version streams in as it comes. On a phone, add Confuzzled to your home screen.
          </p>
          <p>
            Paste a public URL and we’ll try to fetch the page. Upload a PDF and we’ll extract
            selectable text. A photo is sent with Unconfuzzle so visible words can be read; blurry
            labels stay unread — we won’t invent them.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>TL;DR</strong> — what this actually means
            </li>
            <li>
              <strong>Step-by-step</strong> — do this, then this
            </li>
            <li>
              <strong>Feynman</strong> — plain English, no jargon
            </li>
            <li>
              <strong>Socratic</strong> — questions that unstick you
            </li>
            <li>
              <strong>Visual</strong> — how the pieces connect
            </li>
            <li>
              <strong>Flashcards</strong> — remember the bits that matter
            </li>
          </ul>
          <p className="text-muted-foreground">
            Electricians, parents, first-timers, professionals, students — if you’re lost, you’re in
            the right place. We stay honest to your source and won’t invent safety-critical steps.
          </p>
          <p>
            Every generate is saved in this browser. Open the dashboard to rate it, pin it, or set a
            default mode. Nothing is sent to a cloud account — there isn’t one yet.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
