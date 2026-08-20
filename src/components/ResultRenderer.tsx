"use client";

import { useEffect, useId, useState } from "react";
import { BookOpen, Check, Copy, HelpCircle, Lightbulb, Quote, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isOutputMode, type OutputMode } from "@/lib/input-router";
import {
  isFlashcardList,
  isMermaidOutput,
  isSocraticList,
  isStepList,
  isTextOutput,
  type FormattedOutput,
} from "@/lib/output-formatter";
import type { FollowUp } from "@/lib/workspace";
import { cn } from "@/lib/utils";

type ResultRendererProps = {
  data: FormattedOutput | null;
  mode: OutputMode | string;
  isLoading?: boolean;
  checkedSteps?: number[];
  followUps?: FollowUp[];
  stuckStep?: number | null;
  onToggleStep?: (step: number) => void;
  onStuck?: (step: number, text: string) => void;
};

function splitFeynman(content: string): { analogy: string; explanation: string } {
  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  if (blocks.length >= 2) {
    return { analogy: blocks[0] ?? content, explanation: blocks.slice(1).join("\n\n") };
  }
  return { analogy: "Think of it in everyday terms.", explanation: content };
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

function useIsDark(): boolean {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setDark(root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return dark;
}

function MermaidBlock({ chart }: { chart: string }) {
  const reactId = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const isDark = useIsDark();

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setSvg(null);

    const renderChart = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: isDark ? "dark" : "neutral",
          fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif",
        });
        const { svg: nextSvg } = await mermaid.render(`confuzzle-${reactId}`, chart);
        if (!cancelled) {
          setSvg(nextSvg);
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      }
    };

    void renderChart();
    return () => {
      cancelled = true;
    };
  }, [chart, isDark, reactId]);

  if (failed) {
    return (
      <pre className="overflow-x-auto rounded-xl bg-muted/60 p-4 text-sm leading-relaxed">
        <code>{chart}</code>
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Rendering diagram">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-6 w-2/3" />
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-xl bg-muted/40 p-4 [&_svg]:mx-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function Flashcard({
  front,
  back,
  index,
}: {
  front: string;
  back: string;
  index: number;
}) {
  const [flipped, setFlipped] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const label = flipped ? `Card ${index + 1} back` : `Card ${index + 1} front`;

  return (
    <button
      type="button"
      className="group h-48 w-full min-h-12 text-left [perspective:1200px] focus-visible:outline-none"
      aria-pressed={flipped}
      aria-label={`${label}. Activate to flip.`}
      onClick={() => setFlipped((value) => !value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setFlipped((value) => !value);
        }
      }}
    >
      <span
        className={cn(
          "relative block h-full w-full rounded-2xl [transform-style:preserve-3d]",
          !reducedMotion && "transition-transform duration-500",
          flipped && "[transform:rotateY(180deg)]",
        )}
      >
        <span className="absolute inset-0 flex flex-col justify-between rounded-2xl border bg-card p-4 shadow-sm ring-offset-background group-hover:border-primary/40 group-focus-visible:ring-2 group-focus-visible:ring-ring [backface-visibility:hidden]">
          <Badge variant="secondary">Front</Badge>
          <span className="text-base font-medium leading-snug">{front}</span>
          <span className="text-xs text-muted-foreground">Tap to flip</span>
        </span>
        <span className="absolute inset-0 flex flex-col justify-between rounded-2xl border bg-primary p-4 text-primary-foreground shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <Badge variant="outline" className="w-fit border-primary-foreground/40 text-primary-foreground">
            Back
          </Badge>
          <span className="text-sm leading-relaxed">{back}</span>
          <span className="text-xs text-primary-foreground/80">Tap to flip back</span>
        </span>
      </span>
    </button>
  );
}

function LoadingSkeleton({ mode }: { mode: string }) {
  if (mode === "flashcards") {
    return (
      <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Loading flashcards">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (mode === "step_by_step") {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading steps">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading result">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-16 w-5/6" />
    </div>
  );
}

function RawFallback({ text }: { text: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Clarified
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}

export function ResultRenderer({
  data,
  mode,
  isLoading = false,
  checkedSteps = [],
  followUps = [],
  stuckStep = null,
  onToggleStep,
  onStuck,
}: ResultRendererProps) {
  if (isLoading) {
    return <LoadingSkeleton mode={mode} />;
  }

  if (!data) {
    return null;
  }

  const resolvedMode = isOutputMode(mode) ? mode : "tl_dr";

  if (resolvedMode === "flashcards" && isFlashcardList(data)) {
    if (data.length === 0) {
      return <RawFallback text="No flashcards came back. Try another mode or a shorter source." />;
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {data.map((card, index) => (
          <Flashcard key={`${card.front}-${index}`} front={card.front} back={card.back} index={index} />
        ))}
      </div>
    );
  }

  if (resolvedMode === "step_by_step" && isStepList(data)) {
    if (data.length === 0) {
      return <RawFallback text="No steps came back. Paste a bit more detail and try again." />;
    }
    return (
      <ol className="space-y-3">
        {data.map((item) => {
          const checked = checkedSteps.includes(item.step);
          const followUp = followUps.find((entry) => entry.step === item.step);
          const waiting = stuckStep === item.step;
          return (
            <li key={`${item.step}-${item.text}`}>
              <article
                className={cn(
                  "rounded-2xl border bg-card p-4 transition-colors sm:p-5",
                  checked && "border-primary/40 bg-primary/5",
                )}
              >
                <div className="flex gap-3 sm:gap-4">
                  {onToggleStep ? (
                    <button
                      type="button"
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold transition-colors",
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background text-foreground",
                      )}
                      aria-pressed={checked}
                      aria-label={checked ? `Step ${item.step} done. Mark not done.` : `Mark step ${item.step} done`}
                      onClick={() => onToggleStep(item.step)}
                    >
                      {checked ? <Check className="h-5 w-5" aria-hidden="true" /> : item.step}
                    </button>
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
                      {item.step}
                    </span>
                  )}
                  <div className="min-w-0 flex-1 space-y-3">
                    <p className={cn("font-semibold leading-snug", checked && "text-muted-foreground line-through")}>
                      {item.text}
                    </p>
                    {followUp ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {followUp.content}
                      </p>
                    ) : null}
                    {onStuck ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-3"
                        disabled={waiting}
                        onClick={() => onStuck(item.step, item.text)}
                      >
                        {waiting ? "Working…" : followUp ? "Explain again" : "Explain this step"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    );
  }

  if (resolvedMode === "socratic" && isSocraticList(data)) {
    if (data.length === 0) {
      return <RawFallback text="No questions came back. Try again with a clearer source." />;
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            Guided questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {data.map((item, index) => (
              <AccordionItem key={`${item.question}-${index}`} value={`item-${index}`}>
                <AccordionTrigger>
                  <span>
                    <span className="mr-2 text-xs font-semibold text-muted-foreground">Q{index + 1}</span>
                    {item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent>{item.hint || "Sit with the question — no hint was returned."}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    );
  }

  if (resolvedMode === "visual" && isMermaidOutput(data)) {
    const copyMermaid = async () => {
      try {
        await navigator.clipboard.writeText(data.code);
        toast.success("Mermaid copied.");
      } catch {
        toast.error("Could not copy. Select the code and copy it manually.");
      }
    };

    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Relationship map</CardTitle>
          <Button type="button" variant="outline" onClick={() => void copyMermaid()}>
            <Copy aria-hidden="true" />
            Copy Mermaid
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <MermaidBlock chart={data.code} />
        </CardContent>
      </Card>
    );
  }

  if (isTextOutput(data)) {
    if (resolvedMode === "feynman") {
      const { analogy, explanation } = splitFeynman(data.content);
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-accent-foreground" aria-hidden="true" />
              Analogy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base font-semibold leading-relaxed">{analogy}</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{explanation}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-primary/20 bg-gradient-to-br from-card to-accent/20">
        <CardHeader className="flex-row items-start gap-3 space-y-0">
          <Quote className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            The point
          </CardTitle>
        </CardHeader>
        <CardContent>
          <blockquote className="border-l-4 border-primary pl-5 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            {data.content}
          </blockquote>
          <p className="mt-4 text-xs text-muted-foreground">From your source. We didn’t add numbers that weren’t there.</p>
        </CardContent>
      </Card>
    );
  }

  return <RawFallback text={typeof data === "string" ? data : JSON.stringify(data)} />;
}
