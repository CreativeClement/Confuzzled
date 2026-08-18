"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ResultFeedback, ResultToolbar } from "@/components/ResultFeedback";
import { ResultRenderer } from "@/components/ResultRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { OUTPUT_MODE_OPTIONS } from "@/lib/input-router";

function modeLabel(mode: string): string {
  return OUTPUT_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? mode;
}

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, history, patchClarification, removeClarification } = useWorkspace();
  const id = typeof params.id === "string" ? params.id : "";
  const item = history.find((entry) => entry.id === id) ?? null;

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
      </div>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{item.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
            new Date(item.createdAt),
          )}
        </p>
      </div>
      <ResultToolbar
        result={item.result}
        mode={item.mode}
        pinned={item.pinned}
        onPin={() => {
          const next = !item.pinned;
          patchClarification(item.id, { pinned: next });
          toast.success(next ? "Pinned." : "Unpinned.");
        }}
      />
      <ResultRenderer data={item.result} mode={item.mode} />
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
