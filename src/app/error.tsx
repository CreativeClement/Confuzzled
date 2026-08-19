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
    console.error("Confuzzled page error", error);
  }, [error]);

  return (
    <MarketingPage
      kicker="Error"
      title="Something came untangled"
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
      <p>Confuzzled hit an error on this page. Try again, or go back to the homepage.</p>
    </MarketingPage>
  );
}
