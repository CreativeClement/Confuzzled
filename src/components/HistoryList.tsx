"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { OUTPUT_MODE_OPTIONS, isOutputMode, type OutputMode } from "@/lib/input-router";
import { searchHistory, type HistoryItem } from "@/lib/workspace";

function modeLabel(mode: string): string {
  return OUTPUT_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? mode;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function HistoryList({
  items,
  emptyMessage,
}: {
  items: HistoryItem[];
  emptyMessage: string;
}) {
  const { removeClarification } = useWorkspace();
  const [query, setQuery] = useState("");
  const [modeFilter, setModeFilter] = useState<OutputMode | "all">("all");

  const filtered = useMemo(() => {
    const searched = searchHistory(items, query);
    if (modeFilter === "all") {
      return searched;
    }
    return searched.filter((item) => item.mode === modeFilter);
  }, [items, modeFilter, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles and sources"
            aria-label="Search history"
            className="pl-10"
          />
        </div>
        <Select
          value={modeFilter}
          onValueChange={(value) => {
            if (value === "all" || isOutputMode(value)) {
              setModeFilter(value);
            }
          }}
        >
          <SelectTrigger className="sm:max-w-xs" aria-label="Filter by mode">
            <SelectValue placeholder="All modes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modes</SelectItem>
            {OUTPUT_MODE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">{emptyMessage}</CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => (
            <li key={item.id}>
              <article className="rounded-2xl border bg-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold">{item.title}</h2>
                      <Badge variant="outline">{modeLabel(item.mode)}</Badge>
                      {item.pinned ? <Badge variant="secondary">Pinned</Badge> : null}
                      {item.comprehension === "got_it" ? <Badge variant="accent">I get it</Badge> : null}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatWhen(item.createdAt)}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{item.sourcePreview}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                      <Link href={`/dashboard/history/${item.id}`}>Open</Link>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label={`Delete ${item.title}`}
                      onClick={() => {
                        const confirmed = window.confirm("Delete this clarification from this device?");
                        if (!confirmed) {
                          return;
                        }
                        removeClarification(item.id);
                        toast.success("Deleted.");
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
