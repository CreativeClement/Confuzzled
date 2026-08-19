"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Confuzzled page error", error);
  }, [error]);

  return (
    <main id="main" className="container py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Something came untangled</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        Confuzzled hit an error on this page. Try again, or go back to the homepage.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </main>
  );
}
