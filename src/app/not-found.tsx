"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="container py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">That page is missing</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        The link may be old, or this clarification only exists in another browser.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Unconfuzzle something</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
