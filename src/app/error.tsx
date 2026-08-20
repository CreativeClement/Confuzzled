"use client";

import { useEffect } from "react";
import Link from "next/link";

import { MarketingPage } from "@/components/MarketingPage";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Confuzzle page error", error);
  }, [error]);

  return (
    <MarketingPage
      kicker="Error"
      title="Something went wrong."
      center
      actions={
        <>
          <Button type="button" variant="brand" onClick={reset}>
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Home</Link>
          </Button>
        </>
      }
    >
      <p>This page ran into an error. Try again, or return to the homepage.</p>
    </MarketingPage>
  );
}
