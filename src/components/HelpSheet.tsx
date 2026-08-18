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
            Paste instructions, a spec, a wiring note, a form, a recipe, a manual, a messy email, a
            URL, or a photo of a label. Pick how you want it back.
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
