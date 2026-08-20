import Link from "next/link";

import { MarketingPage } from "@/components/MarketingPage";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <MarketingPage
      kicker="404"
      title="Confuzzle doesn’t have this page"
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
      <p>This problem isn’t here. Bring Confuzzle the thing that has you confuzzled instead.</p>
    </MarketingPage>
  );
}
