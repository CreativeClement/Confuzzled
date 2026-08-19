"use client";

import { useMemo, useRef, useState } from "react";
import { AlertCircle, Camera, Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

import { LensSwitch } from "@/components/LensSwitch";
import { ResultFeedback, ResultToolbar } from "@/components/ResultFeedback";
import { ResultRenderer } from "@/components/ResultRenderer";
import { SafetyStrip } from "@/components/SafetyStrip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { requestClarify } from "@/lib/clarify-client";
import { detectInputType, OUTPUT_MODE_OPTIONS, type OutputMode } from "@/lib/input-router";
import { recommendOutputMode } from "@/lib/lens";
import { isTextOutput, type FormattedOutput } from "@/lib/output-formatter";
import { detectSafetyNotice } from "@/lib/safety";
import {
  isSampleSource,
  SAMPLE_FOLLOW_UPS,
  SAMPLE_INPUT_TYPE,
  SAMPLE_MODE,
  SAMPLE_RESULT,
  SAMPLE_SOURCE,
} from "@/lib/sample";
import { readUploadedFile } from "@/lib/uploads";
import { cn } from "@/lib/utils";
import type { FollowUp } from "@/lib/workspace";

const INPUT_TYPE_LABELS = {
  text: "Text",
  pdf: "PDF",
  url: "URL",
  video: "Video",
  audio: "Audio",
  image: "Image",
} as const;

export default function HomePage() {
  const { profile, addClarification, patchClarification, history } = useWorkspace();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FormattedOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultMode, setResultMode] = useState<OutputMode>("step_by_step");
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [stuckStep, setStuckStep] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const detectedType = useMemo(() => detectInputType(text), [text]);
  const recommended = useMemo(
    () => recommendOutputMode(text, profile?.defaultMode),
    [profile?.defaultMode, text],
  );
  const recommendedMeta = OUTPUT_MODE_OPTIONS.find((option) => option.value === recommended);
  const canGenerate = !loading && text.trim().length > 0;
  const activeItem = history.find((item) => item.id === historyId) ?? null;
  const safety = useMemo(() => detectSafetyNotice(text), [text]);
  const checkedSteps = activeItem?.checkedSteps ?? [];
  const followUps = activeItem?.followUps ?? [];

  const attachFiles = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) {
      return;
    }
    try {
      const nextText = await readUploadedFile(file);
      setText((current) => (current.trim() ? `${current.trim()}\n\n${nextText}` : nextText));
      setFileName(file.name);
      setError(null);
      toast.success("Attached. Add any extra notes, then Unconfuzzle.");
    } catch {
      setError("That file could not be read. Paste the text instead.");
      toast.error("That file could not be read. Paste the text instead.");
    }
  };

  const saveResult = (
    content: string,
    data: FormattedOutput,
    mode: OutputMode,
    inputType = detectInputType(content),
    replace = false,
  ) => {
    setResult(data);
    setResultMode(mode);
    if (replace && historyId) {
      patchClarification(historyId, {
        result: data,
        mode,
        checkedSteps: [],
        followUps: [],
      });
    } else {
      const saved = addClarification({
        source: content,
        mode,
        inputType,
        result: data,
      });
      setHistoryId(saved?.id ?? null);
    }
    window.requestAnimationFrame(() => {
      resultsHeadingRef.current?.focus();
    });
  };

  const handleUnconfuzzle = async (mode: OutputMode | "auto", replace = false) => {
    const content = text.trim();
    if (!content) {
      setError("Show Confuzzled the confusing thing.");
      toast.error("Show Confuzzled the confusing thing.");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(18);
    const timer = window.setInterval(() => {
      setProgress((value) => (value >= 88 ? value : value + 7));
    }, 350);

    try {
      const payload = await requestClarify({
        content,
        mode,
        role: profile?.role,
      });

      if (!payload.success) {
        if (!replace) {
          setResult(null);
          setHistoryId(null);
        }
        setError(payload.error || "Something went sideways. Try again.");
        toast.error(payload.error || "Something went sideways. Try again.");
        return;
      }

      setProgress(100);
      saveResult(content, payload.data, payload.mode, payload.inputType, replace);
      if (payload.warning) {
        toast.message(payload.warning);
      } else if (payload.fetched) {
        toast.success("Pulled the page. Here’s the clear version.");
      } else {
        toast.success(replace ? "Same source. New lens." : "Here’s the clear version.");
      }
    } catch {
      setError("Network error. Check your connection and try again.");
      toast.error("Network error. Check your connection and try again.");
    } finally {
      window.clearInterval(timer);
      setLoading(false);
    }
  };

  const handleStuck = async (step: number, stepText: string) => {
    const content = text.trim();
    if (!historyId) {
      return;
    }
    const canned = isSampleSource(content) ? SAMPLE_FOLLOW_UPS[step] : undefined;
    if (canned) {
      const next: FollowUp[] = [...followUps.filter((item) => item.step !== step), { step, content: canned }];
      patchClarification(historyId, { followUps: next });
      toast.success("From your source — just that step.");
      return;
    }

    setStuckStep(step);
    try {
      const payload = await requestClarify({
        content,
        mode: "feynman",
        role: profile?.role,
        focus: { step, text: stepText },
      });
      if (!payload.success || !payload.data || !isTextOutput(payload.data)) {
        toast.error(payload.success === false ? payload.error : "Could not unstick that step.");
        return;
      }
      const next: FollowUp[] = [
        ...followUps.filter((item) => item.step !== step),
        { step, content: payload.data.content },
      ];
      patchClarification(historyId, { followUps: next });
      toast.success("From your source — just that step.");
    } catch {
      toast.error("Network error. Try that step again.");
    } finally {
      setStuckStep(null);
    }
  };

  const loadSample = () => {
    setText(SAMPLE_SOURCE);
    setFileName("");
    setError(null);
    setProgress(100);
    setHistoryId(null);
    setResult(SAMPLE_RESULT);
    setResultMode(SAMPLE_MODE);
    const saved = addClarification({
      source: SAMPLE_SOURCE,
      mode: SAMPLE_MODE,
      inputType: SAMPLE_INPUT_TYPE,
      result: SAMPLE_RESULT,
    });
    setHistoryId(saved?.id ?? null);
    toast.success("Sample loaded. Check steps off, or tap stuck.");
    window.requestAnimationFrame(() => {
      resultsHeadingRef.current?.focus();
    });
  };

  return (
    <main id="main" className="container py-10 sm:py-16">
      <section aria-labelledby="hero-heading" className="mx-auto max-w-2xl text-center">
        <h1
          id="hero-heading"
          className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl"
        >
          Show it the confusing thing.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
          Get back a version you can follow. We don’t invent safety-critical steps.
        </p>
      </section>

      <section id="workspace" aria-labelledby="workspace-heading" className="mx-auto mt-10 max-w-2xl">
        <h2 id="workspace-heading" className="sr-only">
          Unconfuzzle
        </h2>
        <div
          ref={dropRef}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            if (!dropRef.current?.contains(event.relatedTarget as Node)) {
              setDragging(false);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void attachFiles(event.dataTransfer.files);
          }}
          className={cn(
            "rounded-[1.75rem] border bg-card/80 p-4 shadow-sm transition-colors sm:p-6",
            dragging && "border-primary bg-primary/5",
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Paste, drop, or upload.</p>
            <Badge variant="outline">{INPUT_TYPE_LABELS[detectedType]}</Badge>
          </div>
          <Textarea
            id="source-input"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="A wiring note. A letter you don’t get. Assembly steps. Whatever has you stuck."
            aria-describedby="source-hint"
            className="min-h-[200px] border-0 bg-transparent p-1 shadow-none focus-visible:ring-0 md:text-base"
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                if (canGenerate) {
                  void handleUnconfuzzle("auto");
                }
              }
            }}
          />
          <p id="source-hint" className="sr-only">
            Inputs longer than 4,000 characters are truncated.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              aria-label="Upload a file"
              onChange={(event) => {
                void attachFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading}>
              <Upload aria-hidden="true" />
              {fileName || "Upload"}
            </Button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              aria-label="Take a photo of the confusing thing"
              onChange={(event) => {
                void attachFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()} disabled={loading}>
              <Camera aria-hidden="true" />
              Photo
            </Button>
            <p className="text-xs text-muted-foreground">⌘↵ or Ctrl+Enter</p>
            {text.trim() ? (
              <p className="text-xs text-muted-foreground">
                {recommendedMeta ? `${recommendedMeta.label} — you can switch after.` : null}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            size="lg"
            className="sm:flex-1"
            onClick={() => void handleUnconfuzzle("auto")}
            disabled={!canGenerate}
            aria-busy={loading}
            aria-keyshortcuts="Control+Enter Meta+Enter"
          >
            {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
            {loading ? "Untangling…" : "Unconfuzzle this"}
          </Button>
          <Button type="button" size="lg" variant="ghost" disabled={loading} onClick={loadSample}>
            Try a sample
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive" className="mt-6" aria-live="assertive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Could not clarify</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-10 space-y-5" aria-live="polite">
          {(loading || result) && (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">The clear version</p>
                <h2
                  ref={resultsHeadingRef}
                  tabIndex={-1}
                  className="text-3xl font-semibold tracking-tight focus:outline-none"
                >
                  {loading ? "Working through it" : "Here."}
                </h2>
              </div>
              {loading ? <Progress value={progress} className="h-2" aria-label="Clarifying your source" /> : null}
              {result && !loading ? (
                <div className="space-y-5">
                  {safety ? <SafetyStrip notice={safety} /> : null}
                  <LensSwitch
                    value={resultMode}
                    recommended={recommended}
                    disabled={loading}
                    onChange={(mode) => void handleUnconfuzzle(mode, true)}
                  />
                  <ResultToolbar
                    result={result}
                    mode={resultMode}
                    pinned={activeItem?.pinned}
                    onPin={
                      historyId
                        ? () => {
                            const next = !(activeItem?.pinned ?? false);
                            patchClarification(historyId, { pinned: next });
                            toast.success(next ? "Pinned." : "Unpinned.");
                          }
                        : undefined
                    }
                  />
                  <ResultRenderer
                    data={result}
                    mode={resultMode}
                    checkedSteps={checkedSteps}
                    followUps={followUps}
                    stuckStep={stuckStep}
                    onToggleStep={
                      historyId
                        ? (step) => {
                            const next = checkedSteps.includes(step)
                              ? checkedSteps.filter((value) => value !== step)
                              : [...checkedSteps, step];
                            patchClarification(historyId, { checkedSteps: next });
                          }
                        : undefined
                    }
                    onStuck={historyId ? handleStuck : undefined}
                  />
                  {historyId ? (
                    <ResultFeedback
                      rating={activeItem?.rating ?? null}
                      comprehension={activeItem?.comprehension ?? null}
                      onRate={(value) => {
                        patchClarification(historyId, { rating: value });
                        toast.success("Saved.");
                      }}
                      onComprehension={(value) => {
                        patchClarification(historyId, { comprehension: value });
                        toast.success("Saved.");
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
