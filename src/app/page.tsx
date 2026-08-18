"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Eraser,
  Lightbulb,
  Loader2,
  Quote,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  OUTPUT_MODE_OPTIONS,
  detectInputType,
  isOutputMode,
  type InputType,
  type OutputMode,
} from "@/lib/input-router";
import type {
  FlashcardItem,
  FormattedOutput,
  MermaidOutput,
  SocraticItem,
  StepItem,
  TextOutput,
} from "@/lib/output-formatter";
import { cn } from "@/lib/utils";

type ClarifySuccess = {
  success: true;
  data: FormattedOutput;
  mode: OutputMode;
  inputType: InputType;
};

type ClarifyFailure = {
  success: false;
  error: string;
  data: null;
};

const INPUT_TYPE_LABELS: Record<InputType, string> = {
  text: "Text",
  pdf: "PDF",
  url: "URL",
  video: "Video",
  audio: "Audio",
  image: "Image",
};

function isMermaid(value: FormattedOutput): value is MermaidOutput {
  return typeof value === "object" && value !== null && !Array.isArray(value) && value.type === "mermaid";
}

function isText(value: FormattedOutput): value is TextOutput {
  return typeof value === "object" && value !== null && !Array.isArray(value) && value.type === "text";
}

function isFlashcards(value: FormattedOutput): value is FlashcardItem[] {
  return Array.isArray(value) && value.every((item) => "front" in item && "back" in item);
}

function isSteps(value: FormattedOutput): value is StepItem[] {
  return Array.isArray(value) && value.every((item) => "step" in item && "text" in item);
}

function isSocratic(value: FormattedOutput): value is SocraticItem[] {
  return Array.isArray(value) && value.every((item) => "question" in item && "hint" in item);
}

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

function markerForFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return "[[input:pdf]]";
  }
  if (file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(name)) {
    return "[[input:image]]";
  }
  if (file.type.startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(name)) {
    return "[[input:audio]]";
  }
  if (file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(name)) {
    return "[[input:video]]";
  }
  return null;
}

function readUploadedFile(file: File): Promise<string> {
  const marker = markerForFile(file);
  if (marker) {
    return Promise.resolve(
      `${marker}\nUploaded file: ${file.name} (${file.type || "unknown"}, ${file.size} bytes).\nClarify from the filename and any additional pasted context.`,
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read that file."));
    reader.readAsText(file);
  });
}

function FlipCard({ front, back, index }: { front: string; back: string; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const label = flipped ? `Card ${index + 1} back` : `Card ${index + 1} front`;

  return (
    <button
      type="button"
      className="group h-48 w-full min-h-12 text-left [perspective:1200px] focus-visible:outline-none"
      aria-pressed={flipped}
      aria-label={`${label}. Activate to flip.`}
      onClick={() => setFlipped((value) => !value)}
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

function ResultView({
  result,
  selectedMode,
}: {
  result: FormattedOutput;
  selectedMode: OutputMode;
}) {
  if (selectedMode === "tl_dr" && isText(result)) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-card to-accent/20">
        <CardHeader className="flex-row items-start gap-3 space-y-0">
          <Quote className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle className="text-base">The point</CardTitle>
        </CardHeader>
        <CardContent>
          <blockquote className="border-l-4 border-primary pl-4 text-lg font-bold leading-relaxed">
            {result.content}
          </blockquote>
        </CardContent>
      </Card>
    );
  }

  if (selectedMode === "step_by_step" && isSteps(result)) {
    return (
      <ol className="space-y-3">
        {result.map((item) => (
          <li key={`${item.step}-${item.text}`}>
            <Card className="transition-colors hover:border-primary/40">
              <CardContent className="flex gap-4 p-5">
                <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Step {item.step}
                  </p>
                  <p className="font-medium leading-relaxed">{item.text}</p>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    );
  }

  if (selectedMode === "feynman" && isText(result)) {
    const { analogy, explanation } = splitFeynman(result.content);
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

  if (selectedMode === "socratic" && isSocratic(result)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Guided questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {result.map((item, index) => (
              <AccordionItem key={`${item.question}-${index}`} value={`item-${index}`}>
                <AccordionTrigger>
                  <span>
                    <span className="mr-2 text-xs font-semibold text-muted-foreground">Q{index + 1}</span>
                    {item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent>{item.hint || "Sit with the question."}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    );
  }

  if (selectedMode === "visual" && isMermaid(result)) {
    const copyMermaid = async () => {
      try {
        await navigator.clipboard.writeText(result.code);
        toast.success("Mermaid copied.");
      } catch {
        toast.error("Could not copy. Select the code and copy it manually.");
      }
    };

    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Mermaid diagram</CardTitle>
          <Button type="button" variant="outline" onClick={() => void copyMermaid()}>
            <Copy aria-hidden="true" />
            Copy Mermaid
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-xl bg-muted/60 p-4 text-sm leading-relaxed">
            <code>{result.code}</code>
          </pre>
        </CardContent>
      </Card>
    );
  }

  if (selectedMode === "flashcards" && isFlashcards(result)) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {result.map((card, index) => (
          <FlipCard key={`${card.front}-${index}`} front={card.front} back={card.back} index={index} />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">
        Nothing usable came back. Try another mode or a shorter source.
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const [text, setText] = useState("");
  const [selectedMode, setSelectedMode] = useState<OutputMode>("tl_dr");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FormattedOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultMode, setResultMode] = useState<OutputMode>("tl_dr");
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

  const detectedType = useMemo(() => detectInputType(text), [text]);
  const modeMeta = OUTPUT_MODE_OPTIONS.find((option) => option.value === selectedMode);
  const canGenerate = !loading && text.trim().length > 0;

  useEffect(() => {
    if (!loading) {
      return;
    }
    setProgress(16);
    const timer = window.setInterval(() => {
      setProgress((value) => (value >= 88 ? value : value + 7));
    }, 350);
    return () => window.clearInterval(timer);
  }, [loading]);

  const handleUpload = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) {
      return;
    }
    try {
      const nextText = await readUploadedFile(file);
      setText((current) => (current.trim() ? `${current.trim()}\n\n${nextText}` : nextText));
      setFileName(file.name);
      setError(null);
      toast.success("File attached. Add any extra notes, then generate.");
    } catch {
      setError("That file could not be read. Paste the text instead.");
      toast.error("That file could not be read. Paste the text instead.");
    }
  };

  const handleGenerate = async () => {
    const content = text.trim();
    if (!content) {
      setError("Paste or upload something to unconfuzzle.");
      toast.error("Paste or upload something to unconfuzzle.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, mode: selectedMode }),
      });

      const payload = (await response.json()) as ClarifySuccess | ClarifyFailure;

      if (!payload.success) {
        setResult(null);
        setError(payload.error || "Something went sideways. Try again.");
        toast.error(payload.error || "Something went sideways. Try again.");
        return;
      }

      setProgress(100);
      setResult(payload.data);
      setResultMode(payload.mode);
      toast.success("Here’s the clear version.");
      window.requestAnimationFrame(() => {
        resultsHeadingRef.current?.focus();
      });
    } catch {
      setError("Network error. Check your connection and try again.");
      toast.error("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main" className="container py-10 sm:py-14">
      <section aria-labelledby="hero-heading" className="mx-auto max-w-3xl text-center">
        <Badge variant="accent" className="mb-4">
          For every confused human
        </Badge>
        <h1
          id="hero-heading"
          className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
        >
          Stuck on something? Unconfuzzle it.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
          Not a study app. A clarity engine for real life — assembly instructions, a wiring note, an
          insurance letter, a recipe, a 40-page manual, a message you still don’t get. Paste the
          thing that’s confusing you. Get it back in a form you can actually follow.
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild size="lg">
            <a href="#workspace">Unconfuzzle this</a>
          </Button>
        </div>
      </section>

      <section id="workspace" aria-labelledby="workspace-heading" className="mx-auto mt-12 max-w-3xl">
        <Card>
          <CardHeader className="gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="workspace-heading" className="text-xl font-semibold leading-none tracking-tight">
                Drop whatever’s confusing you
              </h2>
              <Badge variant="outline">{INPUT_TYPE_LABELS[detectedType]} detected</Badge>
            </div>
            <CardDescription>
              Instructions, a spec, an email, a photo of a label, a video, a PDF — paste it or upload
              it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="source-input" className="text-sm font-medium">
                Source
              </label>
              <Textarea
                id="source-input"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Paste text, spec, lecture notes, or any content..."
                aria-describedby="source-hint"
              />
              <p id="source-hint" className="text-xs text-muted-foreground">
                Inputs longer than 4,000 characters are truncated before they reach the model.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                aria-label="Upload a file"
                onChange={(event) => {
                  void handleUpload(event.target.files);
                  event.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="sm:w-auto"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload aria-hidden="true" />
                Upload file
              </Button>
              {fileName ? (
                <Input readOnly value={fileName} aria-label="Attached file name" className="sm:max-w-xs" />
              ) : null}
              <div className="min-w-0 flex-1 space-y-2">
                <label htmlFor="mode-select" className="sr-only">
                  Output mode
                </label>
                <Select
                  value={selectedMode}
                  onValueChange={(value) => {
                    if (isOutputMode(value)) {
                      setSelectedMode(value);
                    }
                  }}
                >
                  <SelectTrigger id="mode-select" aria-label="Choose an output mode">
                    <SelectValue placeholder="Choose a mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTPUT_MODE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="font-medium">{option.label}</span>
                        <span className="ml-2 text-muted-foreground">— {option.description}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {modeMeta ? <p className="text-xs text-muted-foreground">{modeMeta.description}</p> : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={!canGenerate}
                aria-busy={loading}
              >
                {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                {loading ? "Untangling…" : "Generate"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setError(null);
                  setResult(null);
                  setProgress(0);
                }}
                disabled={loading}
              >
                Clear result
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setText("");
                  setSelectedMode("tl_dr");
                  setError(null);
                  setResult(null);
                  setFileName("");
                  setProgress(0);
                  setLoading(false);
                }}
                disabled={loading}
              >
                <Eraser aria-hidden="true" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {error ? (
          <Alert variant="destructive" className="mt-6" aria-live="assertive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Could not clarify</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-8 space-y-4" aria-live="polite">
          {(loading || result) && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Result</p>
                <h2
                  ref={resultsHeadingRef}
                  tabIndex={-1}
                  className="text-2xl font-semibold tracking-tight focus:outline-none"
                >
                  {loading ? "Working through it" : "Here’s the clear version"}
                </h2>
              </div>
              {loading ? <Progress value={progress} className="h-3" aria-label="Clarifying your source" /> : null}
              {result && !loading ? <ResultView result={result} selectedMode={resultMode} /> : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
