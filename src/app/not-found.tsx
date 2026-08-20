import Link from "next/link";

import { MarketingPage } from "@/components/MarketingPage";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <MarketingPage
      kicker="404"
      title="This page doesn’t exist."
      center
      actions={
        <>
          <Button asChild variant="brand">
            <Link href="/">Confuzzle this</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </>
      }
    >
      <p>The link may be out of date, or the result may live in another browser.</p>
    </MarketingPage>
  );
}
