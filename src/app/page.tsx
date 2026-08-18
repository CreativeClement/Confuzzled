"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Eraser, Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

import { ResultFeedback, ResultToolbar } from "@/components/ResultFeedback";
import { ResultRenderer } from "@/components/ResultRenderer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
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
import { useWorkspace } from "@/components/WorkspaceProvider";
import {
  OUTPUT_MODE_OPTIONS,
  detectInputType,
  isOutputMode,
  type InputType,
  type OutputMode,
} from "@/lib/input-router";
import type { FormattedOutput } from "@/lib/output-formatter";
import { readUploadedFile } from "@/lib/uploads";

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

export default function HomePage() {
  const { ready, profile, addClarification, patchClarification, history } = useWorkspace();
  const [text, setText] = useState("");
  const [selectedMode, setSelectedMode] = useState<OutputMode>("tl_dr");
  const [modeTouched, setModeTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FormattedOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultMode, setResultMode] = useState<OutputMode>("tl_dr");
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

  const detectedType = useMemo(() => detectInputType(text), [text]);
  const modeMeta = OUTPUT_MODE_OPTIONS.find((option) => option.value === selectedMode);
  const canGenerate = !loading && text.trim().length > 0;
  const activeItem = history.find((item) => item.id === historyId) ?? null;

  useEffect(() => {
    if (!ready || !profile || modeTouched) {
      return;
    }
    setSelectedMode(profile.defaultMode);
  }, [modeTouched, profile, ready]);

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
        body: JSON.stringify({
          content,
          mode: selectedMode,
          role: profile?.role,
        }),
      });

      const payload = (await response.json()) as ClarifySuccess | ClarifyFailure;

      if (!payload.success) {
        setResult(null);
        setHistoryId(null);
        setError(payload.error || "Something went sideways. Try again.");
        toast.error(payload.error || "Something went sideways. Try again.");
        return;
      }

      setProgress(100);
      setResult(payload.data);
      setResultMode(payload.mode);
      const saved = addClarification({
        source: content,
        mode: payload.mode,
        inputType: payload.inputType,
        result: payload.data,
      });
      setHistoryId(saved?.id ?? null);
      toast.success("Here’s the clear version. Saved to your dashboard.");
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
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <a href="#workspace">Unconfuzzle this</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="/dashboard">Open dashboard</a>
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
              it. Each generate is saved on this device.
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
                      setModeTouched(true);
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
                  setHistoryId(null);
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
                  setSelectedMode(profile?.defaultMode ?? "tl_dr");
                  setModeTouched(false);
                  setError(null);
                  setResult(null);
                  setHistoryId(null);
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
              {result && !loading ? (
                <div className="space-y-4">
                  <ResultToolbar
                    result={result}
                    mode={resultMode}
                    pinned={activeItem?.pinned}
                    onPin={
                      historyId
                        ? () => {
                            const next = !(activeItem?.pinned ?? false);
                            patchClarification(historyId, { pinned: next });
                            toast.success(next ? "Pinned to your dashboard." : "Unpinned.");
                          }
                        : undefined
                    }
                  />
                  <ResultRenderer data={result} mode={resultMode} />
                  {historyId ? (
                    <ResultFeedback
                      rating={activeItem?.rating ?? null}
                      comprehension={activeItem?.comprehension ?? null}
                      onRate={(value) => {
                        patchClarification(historyId, { rating: value });
                        toast.success("Rating saved.");
                      }}
                      onComprehension={(value) => {
                        patchClarification(historyId, { comprehension: value });
                        toast.success("Got it — saved to this clarification.");
                      }}
                    />
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
