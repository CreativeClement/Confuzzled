"use client";

import Link from "next/link";
import { Bookmark, History, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { OUTPUT_MODE_OPTIONS } from "@/lib/input-router";
import { workspaceStats } from "@/lib/workspace";

function modeLabel(mode: string): string {
  return OUTPUT_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? mode;
}

export default function DashboardPage() {
  const { ready, profile, history } = useWorkspace();
  const stats = workspaceStats(history);
  const recent = history.slice(0, 5);

  return (
    <main id="main" className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dashboard</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {ready ? `Hi, ${profile?.displayName || "Guest"}` : "Your workspace"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Clarifications stay in this browser. Pin the ones that made it click, rate what
          helped, and set a preferred lens in Settings.
        </p>
      </div>

      {!ready ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Saved here</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Pinned</CardDescription>
              <CardTitle className="text-3xl">{stats.pinned}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Rated</CardDescription>
              <CardTitle className="text-3xl">{stats.rated}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Marked “I get it”</CardDescription>
              <CardTitle className="text-3xl">{stats.gotIt}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="brand">
          <Link href="/#workspace">
            <Sparkles aria-hidden="true" />
            Confuzzle this
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/history">
            <History aria-hidden="true" />
            Full history
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/saved">
            <Bookmark aria-hidden="true" />
            Pinned
          </Link>
        </Button>
      </div>

      <section aria-labelledby="modes-heading" className="space-y-4">
        <h2 id="modes-heading" className="text-xl font-semibold">
          Modes you’ve used
        </h2>
        <div className="flex flex-wrap gap-2">
          {OUTPUT_MODE_OPTIONS.map((option) => (
            <Badge key={option.value} variant={stats.byMode[option.value] > 0 ? "secondary" : "outline"}>
              {option.label}: {stats.byMode[option.value]}
            </Badge>
          ))}
        </div>
      </section>

      <section aria-labelledby="recent-heading" className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 id="recent-heading" className="text-xl font-semibold">
            Recent
          </h2>
          {history.length > 5 ? (
            <Button asChild variant="link">
              <Link href="/dashboard/history">View all</Link>
            </Button>
          ) : null}
        </div>
        {ready && recent.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Nothing saved yet. Tap <strong>Confuzzle this</strong>, or <strong>Try a sample</strong> on the homepage
              (no API key needed).
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {recent.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/dashboard/history/${item.id}`}
                  className="block rounded-2xl border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    <Badge variant="outline">{modeLabel(item.mode)}</Badge>
                    {item.pinned ? <Badge variant="secondary">Pinned</Badge> : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.sourcePreview}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
