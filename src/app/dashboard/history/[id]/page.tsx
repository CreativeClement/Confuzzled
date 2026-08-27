"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CitationChips } from "@/components/CitationChips";
import { ResultFeedback, ResultToolbar } from "@/components/ResultFeedback";
import { ResultRenderer } from "@/components/ResultRenderer";
import { SafetyStrip } from "@/components/SafetyStrip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { citationsFromOutput } from "@/lib/citations";
import { OUTPUT_MODE_OPTIONS } from "@/lib/input-router";
import { getPhoto } from "@/lib/photo-store";
import { detectSafetyNotice } from "@/lib/safety";

function modeLabel(mode: string): string {
  return OUTPUT_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? mode;
}

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, history, patchClarification, removeClarification } = useWorkspace();
  const id = typeof params.id === "string" ? params.id : "";
  const item = history.find((entry) => entry.id === id) ?? null;
  const [title, setTitle] = useState("");
  const [showSource, setShowSource] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      void getPhoto(item.id).then((photo) => {
        setPhotoPreview(photo?.preview ?? null);
      });
    }
  }, [item]);

  const safety = useMemo(() => (item ? detectSafetyNotice(item.source) : null), [item]);
  const citations = useMemo(
    () => (item ? citationsFromOutput(item.source, item.result, item.mode) : []),
    [item],
  );

  if (ready && !item) {
    return (
      <main id="main" className="space-y-4">
        <h1 className="text-2xl font-semibold">Clarification not found</h1>
        <p className="text-sm text-muted-foreground">It may have been deleted, or this is a different browser.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/history">Back to history</Link>
        </Button>
      </main>
    );
  }

  if (!item) {
    return (
      <main id="main">
        <p className="text-sm text-muted-foreground">Loading clarification…</p>
      </main>
    );
  }

  return (
    <main id="main" className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost">
          <Link href="/dashboard/history">
            <ArrowLeft aria-hidden="true" />
            History
          </Link>
        </Button>
        <Badge variant="outline">{modeLabel(item.mode)}</Badge>
        {item.pinned ? <Badge variant="secondary">Pinned</Badge> : null}
        <Button asChild variant="outline">
          <Link href={`/?id=${item.id}`}>
            <Sparkles aria-hidden="true" />
            Open in Unconfuzzle
          </Link>
        </Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="clarification-title" className="sr-only">
          Title
        </Label>
        <Input
          id="clarification-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => {
            const next = title.trim() || item.title;
            if (next !== item.title) {
              patchClarification(item.id, { title: next });
              toast.success("Title saved.");
            }
            setTitle(next);
          }}
          className="h-auto border-0 px-0 text-3xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
        />
        <p className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
            new Date(item.createdAt),
          )}
        </p>
      </div>
      {safety ? <SafetyStrip notice={safety} /> : null}
      {photoPreview ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm backdrop-blur-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoPreview} alt="Attached photo for this clarification" className="h-20 w-20 rounded-xl object-cover" />
          <p className="text-sm text-muted-foreground">Photo kept on this device with this clarification.</p>
        </div>
      ) : null}
      <ResultToolbar
        result={item.result}
        mode={item.mode}
        pinned={item.pinned}
        showingSource={showSource}
        onToggleSource={() => setShowSource((value) => !value)}
        onPin={() => {
          const next = !item.pinned;
          patchClarification(item.id, { pinned: next });
          toast.success(next ? "Pinned." : "Unpinned.");
        }}
      />
      {showSource ? (
        <pre className="whitespace-pre-wrap rounded-2xl border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
          {item.source}
        </pre>
      ) : null}
      <CitationChips citations={citations} />
      <ResultRenderer
        data={item.result}
        mode={item.mode}
        checkedSteps={item.checkedSteps}
        followUps={item.followUps}
        onToggleStep={(step) => {
          const current = item.checkedSteps ?? [];
          const next = current.includes(step)
            ? current.filter((value) => value !== step)
            : [...current, step];
          patchClarification(item.id, { checkedSteps: next });
        }}
      />
      <ResultFeedback
        rating={item.rating}
        comprehension={item.comprehension}
        onRate={(value) => {
          patchClarification(item.id, { rating: value });
          toast.success("Rating saved.");
        }}
        onComprehension={(value) => {
          patchClarification(item.id, { comprehension: value });
          toast.success("Comprehension saved.");
        }}
      />
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Original source</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{item.source}</pre>
        </CardContent>
      </Card>
      <Button
        type="button"
        variant="destructive"
        onClick={() => {
          const confirmed = window.confirm("Delete this clarification from this device?");
          if (!confirmed) {
            return;
          }
          removeClarification(item.id);
          toast.success("Deleted.");
          router.push("/dashboard/history");
        }}
      >
        <Trash2 aria-hidden="true" />
        Delete
      </Button>
    </main>
  );
}
