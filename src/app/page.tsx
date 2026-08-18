"use client";

import { useMemo, useRef, useState } from "react";
import { AlertCircle, Eraser, Loader2, Sparkles, Upload } from "lucide-react";

import { ResultRenderer } from "@/components/ResultRenderer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
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
import type { FormattedOutput } from "@/lib/output-formatter";

type ClarifySuccess = {
  success: true;
  data: FormattedOutput;
  mode: OutputMode;
  inputType: InputType;
  truncated?: boolean;
};

type ClarifyFailure = {
  success: false;
  error: string;
  data: null;
  mode: string | null;
  inputType: string | null;
};

const INPUT_TYPE_LABELS: Record<InputType, string> = {
  text: "Text",
  pdf: "PDF",
  url: "URL",
  video: "Video",
  audio: "Audio",
  image: "Image",
};

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

export default function HomePage() {
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<OutputMode>("tl_dr");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FormattedOutput | null>(null);
  const [resultMeta, setResultMeta] = useState<{ mode: OutputMode; inputType: InputType } | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

  const detectedType = useMemo(() => detectInputType(content), [content]);
  const selectedMode = OUTPUT_MODE_OPTIONS.find((option) => option.value === mode);

  const resetWorkspace = () => {
    setContent("");
    setMode("tl_dr");
    setError(null);
    setResult(null);
    setResultMeta(null);
    setIsLoading(false);
  };

  const clearResult = () => {
    setError(null);
    setResult(null);
    setResultMeta(null);
  };

  const handleUpload = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) {
      return;
    }
    try {
      const text = await readUploadedFile(file);
      setContent((current) => (current.trim() ? `${current.trim()}\n\n${text}` : text));
      setError(null);
    } catch {
      setError("That file could not be read. Paste the text instead.");
    }
  };

  const handleGenerate = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setError("Paste or upload something to unconfuzzle.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed, mode }),
      });

      const payload = (await response.json()) as ClarifySuccess | ClarifyFailure;

      if (!payload.success) {
        setResult(null);
        setResultMeta(null);
        setError(payload.error || "Something went sideways. Try again.");
        return;
      }

      setResult(payload.data);
      setResultMeta({ mode: payload.mode, inputType: payload.inputType });
      window.requestAnimationFrame(() => {
        resultsHeadingRef.current?.focus();
      });
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main id="main" className="container py-10 sm:py-14">
      <section aria-labelledby="hero-heading" className="mx-auto max-w-3xl text-center">
        <Badge variant="accent" className="mb-4">
          Universal AI clarity engine
        </Badge>
        <h1
          id="hero-heading"
          className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
        >
          From muddled to crystal.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
          Paste a wall of text, a talk dump, a URL, or a messy idea. Pick a lens — TL;DR, Feynman,
          Socratic, steps, a visual map, or flashcards — and get a version you can actually use.
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
                Drop the tangle
              </h2>
              <Badge variant="outline">{INPUT_TYPE_LABELS[detectedType]} detected</Badge>
            </div>
            <CardDescription>
              Text files are read in full. PDFs, images, audio, and video are tagged by type so the
              model can treat them honestly from filename and notes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="source-input" className="text-sm font-medium">
                Source
              </label>
              <Textarea
                id="source-input"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Paste notes, a paragraph, a URL, or a transcript…"
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
              <div className="min-w-0 flex-1 space-y-2">
                <label htmlFor="mode-select" className="sr-only">
                  Output mode
                </label>
                <Select
                  value={mode}
                  onValueChange={(value) => {
                    if (isOutputMode(value)) {
                      setMode(value);
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
                {selectedMode ? (
                  <p className="text-xs text-muted-foreground">{selectedMode.description}</p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                {isLoading ? "Untangling…" : "Generate"}
              </Button>
              <Button type="button" variant="secondary" onClick={clearResult} disabled={isLoading}>
                Clear result
              </Button>
              <Button type="button" variant="ghost" onClick={resetWorkspace} disabled={isLoading}>
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
          {(isLoading || result) && (
            <>
              <Separator />
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Result
                  </p>
                  <h2
                    ref={resultsHeadingRef}
                    tabIndex={-1}
                    className="text-2xl font-semibold tracking-tight focus:outline-none"
                  >
                    {isLoading ? "Working through it" : "Here’s the clear version"}
                  </h2>
                </div>
                {resultMeta ? (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{INPUT_TYPE_LABELS[resultMeta.inputType]}</Badge>
                    <Badge>
                      {OUTPUT_MODE_OPTIONS.find((option) => option.value === resultMeta.mode)?.label}
                    </Badge>
                  </div>
                ) : null}
              </div>
              <ResultRenderer data={result} mode={resultMeta?.mode ?? mode} isLoading={isLoading} />
            </>
          )}
        </div>
      </section>
    </main>
  );
}
