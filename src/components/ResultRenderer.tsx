"use client";

import { useEffect, useId, useState } from "react";
import { BookOpen, HelpCircle, Lightbulb, ListOrdered, Quote, Sparkles } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isOutputMode, type OutputMode } from "@/lib/input-router";
import type { FormattedOutput } from "@/lib/output-formatter";
import { cn } from "@/lib/utils";

type ResultRendererProps = {
  data: FormattedOutput | null;
  mode: OutputMode | string;
  isLoading?: boolean;
};

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
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        });
        const { svg: nextSvg } = await mermaid.render(`confuzzled-${reactId}`, chart);
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

export function ResultRenderer({ data, mode, isLoading = false }: ResultRendererProps) {
  if (isLoading) {
    return <LoadingSkeleton mode={mode} />;
  }

  if (!data) {
    return null;
  }

  if (data.type === "raw") {
    return <RawFallback text={data.text} />;
  }

  const resolvedMode: OutputMode = data.type === mode && isOutputMode(mode) ? mode : data.type;

  if (resolvedMode === "tl_dr" && data.type === "tl_dr") {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-card to-accent/20">
        <CardHeader className="flex-row items-start gap-3 space-y-0">
          <Quote className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle className="text-base">The point</CardTitle>
        </CardHeader>
        <CardContent>
          <blockquote className="border-l-4 border-primary pl-4 text-lg font-semibold leading-relaxed">
            {data.summary}
          </blockquote>
        </CardContent>
      </Card>
    );
  }

  if (resolvedMode === "step_by_step" && data.type === "step_by_step") {
    return (
      <ol className="space-y-3">
        {data.steps.map((step, index) => (
          <li key={`${step.title}-${index}`}>
            <Card className="transition-colors hover:border-primary/40">
              <CardContent className="flex gap-4 p-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <div className="space-y-1">
                  <p className="flex items-center gap-2 font-semibold leading-snug">
                    <ListOrdered className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {step.title}
                  </p>
                  {step.detail ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    );
  }

  if (resolvedMode === "feynman" && data.type === "feynman") {
    return (
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-accent-foreground" aria-hidden="true" />
              Analogy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-medium leading-relaxed">
              {data.analogy || "A comparison was not returned; the explanation still stands."}
            </p>
          </CardContent>
        </Card>
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              In plain words
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {data.explanation}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resolvedMode === "socratic" && data.type === "socratic") {
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
            {data.items.map((item, index) => (
              <AccordionItem key={`${item.question}-${index}`} value={`item-${index}`}>
                <AccordionTrigger>
                  <span>
                    <span className="mr-2 text-xs font-semibold text-muted-foreground">Q{index + 1}</span>
                    {item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent>{item.answer || "Sit with the question — no answer was returned."}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    );
  }

  if (resolvedMode === "visual" && data.type === "visual") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Relationship map</CardTitle>
        </CardHeader>
        <CardContent>
          <MermaidBlock chart={data.mermaid} />
        </CardContent>
      </Card>
    );
  }

  if (resolvedMode === "flashcards" && data.type === "flashcards") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {data.cards.map((card, index) => (
          <Flashcard key={`${card.front}-${index}`} front={card.front} back={card.back} index={index} />
        ))}
      </div>
    );
  }

  return <RawFallback text={JSON.stringify(data)} />;
}
