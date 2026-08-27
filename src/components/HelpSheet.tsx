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
        <Button type="button" variant="outline" size="icon" className="rounded-full" aria-label="Who Confuzzle is for">
          <CircleHelp aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>You’re confuzzled. That’s the job.</SheetTitle>
          <SheetDescription>
            Confuzzle is for people confused about something they are doing. Show it the problem.
            Get a version you can follow, so you’re no longer confuzzled.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4 text-sm leading-relaxed">
          <p>
            Paste it, import a PDF, scan or photograph the page, or drop a public URL. Tap
            Unconfuzzle. Confuzzle picks a lens — steps, plain English, questions, a map, or
            flashcards — and you can switch after. Check steps off. If a step still doesn’t land,
            tap stuck and we explain only that part from your source.
          </p>
          <p>
            A photo or scan is sent so visible words can be read. An audio note is transcribed. A
            video still needs the words pasted — we cannot play the file. Blurry labels stay unread
            — we won’t invent them.
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
            If you’re lost in the work, you’re in the right place. We decipher your source. We don’t
            invent one. We won’t invent safety-critical steps.
          </p>
          <p>
            Every Unconfuzzle is saved in this browser. Open the dashboard to rate it, pin it, or
            set a default mode. Nothing is sent to a cloud account — there isn’t one yet.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
