"use client";

import { Bookmark, BookmarkCheck, Copy, Eye, EyeOff, Printer, Share2, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formattedOutputToPlainText, type FormattedOutput } from "@/lib/output-formatter";
import type { OutputMode } from "@/lib/input-router";
import type { Comprehension, Rating } from "@/lib/workspace";
import { cn } from "@/lib/utils";

const COMPREHENSION_OPTIONS: readonly { value: NonNullable<Comprehension>; label: string }[] = [
  { value: "got_it", label: "I get it" },
  { value: "partial", label: "Kind of" },
  { value: "still_stuck", label: "Still stuck" },
];

export function ResultToolbar({
  result,
  mode,
  pinned,
  onPin,
  showingSource,
  onToggleSource,
}: {
  result: FormattedOutput;
  mode: OutputMode;
  pinned?: boolean;
  onPin?: () => void;
  showingSource?: boolean;
  onToggleSource?: () => void;
}) {
  const copyText = async () => {
    const text = formattedOutputToPlainText(result, mode);
    if (!text.trim()) {
      toast.error("Nothing to copy yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied the clear version.");
    } catch {
      toast.error("Could not copy. Select the text and copy it manually.");
    }
  };

  const shareText = async () => {
    const text = formattedOutputToPlainText(result, mode);
    if (!text.trim()) {
      toast.error("Nothing to share yet.");
      return;
    }
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "Confuzzle", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("Copied — paste it wherever you need it.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      toast.error("Could not share. Copy instead.");
    }
  };

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button type="button" variant="outline" onClick={() => void copyText()}>
        <Copy aria-hidden="true" />
        Copy result
      </Button>
      <Button type="button" variant="outline" onClick={() => void shareText()}>
        <Share2 aria-hidden="true" />
        Share
      </Button>
      <Button type="button" variant="outline" onClick={() => window.print()}>
        <Printer aria-hidden="true" />
        Print
      </Button>
      {onToggleSource ? (
        <Button
          type="button"
          variant={showingSource ? "secondary" : "outline"}
          onClick={onToggleSource}
          aria-pressed={showingSource}
        >
          {showingSource ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          {showingSource ? "Hide source" : "Compare source"}
        </Button>
      ) : null}
      {onPin ? (
        <Button type="button" variant={pinned ? "secondary" : "outline"} onClick={onPin} aria-pressed={pinned}>
          {pinned ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
          {pinned ? "Pinned" : "Pin"}
        </Button>
      ) : null}
    </div>
  );
}

export function ResultFeedback({
  rating,
  comprehension,
  onRate,
  onComprehension,
}: {
  rating: Rating;
  comprehension: Comprehension;
  onRate: (value: Rating) => void;
  onComprehension: (value: Comprehension) => void;
}) {
  return (
    <section aria-label="Was this useful?" className="space-y-4 rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm print:hidden">
      <div>
        <p className="text-sm font-medium">Did this unstick you?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {COMPREHENSION_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={comprehension === option.value ? "default" : "outline"}
              aria-pressed={comprehension === option.value}
              onClick={() => onComprehension(comprehension === option.value ? null : option.value)}
            >
              {option.value === "got_it" ? <ThumbsUp aria-hidden="true" /> : null}
              {option.value === "still_stuck" ? <ThumbsDown aria-hidden="true" /> : null}
              {option.label}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium">Rate this clarification</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Rating from 1 to 5">
          {([1, 2, 3, 4, 5] as const).map((value) => (
            <Button
              key={value}
              type="button"
              size="icon"
              variant={rating === value ? "default" : "outline"}
              aria-label={`${value} out of 5`}
              aria-pressed={rating === value}
              className={cn(rating != null && value <= rating && rating !== value && "border-primary/40")}
              onClick={() => onRate(rating === value ? null : value)}
            >
              {value}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
