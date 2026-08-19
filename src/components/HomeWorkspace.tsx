"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AlertCircle, Camera, Loader2, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { HealthBanner } from "@/components/HealthBanner";
import { ResultToolbar } from "@/components/ResultFeedback";
import { SafetyStrip } from "@/components/SafetyStrip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { requestClarify, streamClarify } from "@/lib/clarify-client";
import { isLivePreviewMode } from "@/lib/clarify-sse";
import { citationsFromOutput } from "@/lib/citations";
import { clearDraft, MAX_DRAFT_CHARS, readDraft, writeDraft } from "@/lib/draft";
import { fileToClarifyImage, isImageFile, type AttachedImage } from "@/lib/image-attach";
import { getPhoto, putPhoto } from "@/lib/photo-store";
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

const ResultRenderer = dynamic(
  () => import("@/components/ResultRenderer").then((mod) => mod.ResultRenderer),
  { ssr: false },
);
const ResultFeedback = dynamic(
  () => import("@/components/ResultFeedback").then((mod) => mod.ResultFeedback),
  { ssr: false },
);
const LensSwitch = dynamic(
  () => import("@/components/LensSwitch").then((mod) => mod.LensSwitch),
  { ssr: false },
);
const CitationChips = dynamic(
  () => import("@/components/CitationChips").then((mod) => mod.CitationChips),
  { ssr: false },
);

const INPUT_TYPE_LABELS = {
  text: "Text",
  pdf: "PDF",
  url: "URL",
  video: "Video",
  audio: "Audio",
  image: "Image",
} as const;

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export function HomeWorkspace() {
  const { ready, profile, addClarification, patchClarification, history } = useWorkspace();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FormattedOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultMode, setResultMode] = useState<OutputMode>("step_by_step");
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(0);
  const [streamPreview, setStreamPreview] = useState("");
  const [streamMode, setStreamMode] = useState<OutputMode | null>(null);
  const [dragging, setDragging] = useState(false);
  const [stuckStep, setStuckStep] = useState<number | null>(null);
  const [image, setImage] = useState<AttachedImage | null>(null);
  const [citations, setCitations] = useState<string[]>([]);
  const [showSource, setShowSource] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const detectedType = useMemo(
    () => (image ? "image" : detectInputType(text)),
    [image, text],
  );
  const recommended = useMemo(
    () => recommendOutputMode(text, profile?.defaultMode),
    [profile?.defaultMode, text],
  );
  const recommendedMeta = OUTPUT_MODE_OPTIONS.find((option) => option.value === recommended);
  const canGenerate = !loading && (text.trim().length > 0 || Boolean(image));
  const activeItem = history.find((item) => item.id === historyId) ?? null;
  const safety = useMemo(() => detectSafetyNotice(text), [text]);
  const checkedSteps = activeItem?.checkedSteps ?? [];
  const followUps = activeItem?.followUps ?? [];
  const overLimit = text.length > MAX_DRAFT_CHARS;
  const recent = history.slice(0, 3);

  useEffect(() => {
    if (!ready || sessionLoaded) {
      return;
    }
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) {
      const item = history.find((entry) => entry.id === id);
      if (item) {
        setText(item.source);
        setResult(item.result);
        setResultMode(item.mode);
        setHistoryId(item.id);
        setCitations(citationsFromOutput(item.source, item.result, item.mode));
        void getPhoto(item.id).then((photo) => {
          if (photo) {
            setImage({
              name: photo.name,
              mime: photo.mime,
              data: photo.data,
              preview: photo.preview,
            });
            setFileName(photo.name);
          }
        });
        setSessionLoaded(true);
        return;
      }
    }
    const draft = readDraft(window.localStorage);
    if (draft) {
      setText(draft.text);
    }
    setSessionLoaded(true);
  }, [history, ready, sessionLoaded]);

  useEffect(() => {
    if (!sessionLoaded) {
      return;
    }
    const timer = window.setTimeout(() => {
      try {
        if (!text.trim()) {
          clearDraft(window.localStorage);
        } else {
          writeDraft(window.localStorage, text);
        }
      } catch {
        /* quota */
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [sessionLoaded, text]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const attachFiles = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) {
      return;
    }
    try {
      if (isImageFile(file)) {
        const attached = await fileToClarifyImage(file);
        setImage(attached);
        setFileName(file.name);
        setError(null);
        setText((current) =>
          current.trim()
            ? current
            : `[[input:image]]\nPhoto: ${file.name}. Add any extra notes.`,
        );
        toast.success("Photo attached. Unconfuzzle will read visible text.");
        return;
      }
      setImage(null);
      const nextText = await readUploadedFile(file);
      setText((current) => (current.trim() ? `${current.trim()}\n\n${nextText}` : nextText));
      setFileName(file.name);
      setError(null);
      toast.success("Attached. Add any extra notes, then Unconfuzzle.");
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "That file could not be read. Paste the text instead.";
      setError(message);
      toast.error(message);
    }
  };

  const saveResult = (
    content: string,
    data: FormattedOutput,
    mode: OutputMode,
    inputType = detectInputType(content),
    replace = false,
    nextCitations: string[] = [],
  ) => {
    setResult(data);
    setResultMode(mode);
    setCitations(nextCitations);
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
      if (saved && image) {
        void putPhoto({
          id: saved.id,
          name: image.name,
          mime: image.mime,
          data: image.data,
          preview: image.preview,
        });
      }
    }
    window.requestAnimationFrame(() => {
      resultsHeadingRef.current?.focus();
    });
  };

  const handleUnconfuzzle = async (mode: OutputMode | "auto", replace = false) => {
    const content =
      text.trim() ||
      (image ? `[[input:image]]\nPhoto: ${image.name}. Add any extra notes.` : "");
    if (!content) {
      setError("Show Confuzzled the confusing thing.");
      toast.error("Show Confuzzled the confusing thing.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setProgress(18);
    setStreamPreview("");
    setStreamMode(null);
    if (!replace) {
      setResult(null);
    }

    try {
      const payload = await streamClarify(
        {
          content,
          mode,
          role: profile?.role,
          image: image ? { mime: image.mime, data: image.data } : null,
          signal: controller.signal,
        },
        {
          onMeta: (meta) => {
            setStreamMode(meta.mode);
            setResultMode(meta.mode);
            setProgress(40);
            if (meta.warning) {
              toast.message(meta.warning);
            }
          },
          onDelta: (chunk) => {
            setStreamPreview((current) => current + chunk);
            setProgress((value) => (value >= 92 ? value : value + 1));
          },
          onRetry: () => {
            setStreamPreview("");
            toast.message("Cleaning that up…");
          },
        },
      );

      if (!payload.success) {
        if (!replace) {
          setResult(null);
          setHistoryId(null);
          setCitations([]);
        }
        setError(payload.error || "Something went sideways. Try again.");
        toast.error(payload.error || "Something went sideways. Try again.");
        return;
      }

      setProgress(100);
      setStreamPreview("");
      saveResult(
        content,
        payload.data,
        payload.mode,
        payload.inputType,
        replace,
        payload.citations ?? [],
      );
      if (payload.seen) {
        toast.success("Read the photo. Here’s the clear version.");
      } else if (payload.fetched) {
        toast.success("Pulled the page. Here’s the clear version.");
      } else {
        toast.success(replace ? "Same source. New lens." : "Here’s the clear version.");
      }
    } catch (caught) {
      if (isAbortError(caught)) {
        return;
      }
      setError("Network error. Check your connection and try again.");
      toast.error("Network error. Check your connection and try again.");
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
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

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStuckStep(step);
    try {
      const payload = await requestClarify({
        content,
        mode: "feynman",
        role: profile?.role,
        focus: { step, text: stepText },
        image: image ? { mime: image.mime, data: image.data } : null,
        signal: controller.signal,
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
    } catch (caught) {
      if (isAbortError(caught)) {
        return;
      }
      toast.error("Network error. Try that step again.");
    } finally {
      if (abortRef.current === controller) {
        setStuckStep(null);
      }
    }
  };

  const loadSample = () => {
    abortRef.current?.abort();
    setText(SAMPLE_SOURCE);
    setFileName("");
    setImage(null);
    setError(null);
    setProgress(100);
    setHistoryId(null);
    setResult(SAMPLE_RESULT);
    setResultMode(SAMPLE_MODE);
    setCitations(citationsFromOutput(SAMPLE_SOURCE, SAMPLE_RESULT, SAMPLE_MODE));
    setShowSource(false);
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

  const startNew = () => {
    abortRef.current?.abort();
    setText("");
    setResult(null);
    setError(null);
    setHistoryId(null);
    setFileName("");
    setImage(null);
    setCitations([]);
    setShowSource(false);
    setProgress(0);
    setStreamPreview("");
    setStreamMode(null);
    try {
      clearDraft(window.localStorage);
    } catch {
      /* ignore */
    }
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState({}, "", "/");
    }
  };

  const loadHistoryItem = (id: string) => {
    const item = history.find((entry) => entry.id === id);
    if (!item) {
      return;
    }
    abortRef.current?.abort();
    setText(item.source);
    setResult(item.result);
    setResultMode(item.mode);
    setHistoryId(item.id);
    setCitations(citationsFromOutput(item.source, item.result, item.mode));
    void getPhoto(item.id).then((photo) => {
      if (photo) {
        setImage({
          name: photo.name,
          mime: photo.mime,
          data: photo.data,
          preview: photo.preview,
        });
        setFileName(photo.name);
      } else {
        setImage(null);
        setFileName("");
      }
    });
    setError(null);
    setShowSource(false);
    window.history.replaceState({}, "", `/?id=${item.id}`);
    window.requestAnimationFrame(() => {
      resultsHeadingRef.current?.focus();
    });
  };

  return (
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
            aria-describedby="source-hint source-count"
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
            Inputs longer than 4,000 characters are truncated. A photo can be attached and is sent with Unconfuzzle.
          </p>
          {image ? (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border bg-background/80 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.preview}
                alt={`Attached photo ${image.name}`}
                className="h-16 w-16 rounded-xl object-cover"
              />
              <p className="min-w-0 flex-1 text-xs text-muted-foreground">
                Photo attached. Visible text is sent with Unconfuzzle. Blurry labels stay unread.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove photo"
                onClick={() => {
                  setImage(null);
                  setFileName("");
                }}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          ) : null}
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
            <p id="source-count" className={cn("text-xs text-muted-foreground", overLimit && "text-destructive")}>
              {text.length.toLocaleString()} / {MAX_DRAFT_CHARS.toLocaleString()}
              {overLimit ? " — extra is cut" : null}
            </p>
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
          {text.trim() || result || image ? (
            <Button type="button" size="lg" variant="ghost" disabled={loading} onClick={startNew}>
              New
            </Button>
          ) : null}
        </div>

        <HealthBanner />

        {ready && recent.length > 0 && !result && !loading ? (
          <div className="mt-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent on this device</p>
            <div className="flex flex-wrap gap-2">
              {recent.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant="outline"
                  className="max-w-full"
                  onClick={() => loadHistoryItem(item.id)}
                >
                  <span className="truncate">{item.title}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : null}

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
              {loading && streamPreview && isLivePreviewMode(streamMode ?? resultMode) ? (
                <p className="whitespace-pre-wrap rounded-2xl border bg-card p-5 text-lg font-medium leading-relaxed">
                  {streamPreview}
                </p>
              ) : loading ? (
                <Progress value={progress} className="h-2" aria-label="Clarifying your source" />
              ) : null}
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
                    showingSource={showSource}
                    onToggleSource={() => setShowSource((value) => !value)}
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
                  {showSource ? (
                    <pre className="whitespace-pre-wrap rounded-2xl border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
                      {text}
                    </pre>
                  ) : null}
                  <CitationChips citations={citations} />
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
  );
}
