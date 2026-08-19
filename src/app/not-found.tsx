import Link from "next/link";

import { MarketingPage } from "@/components/MarketingPage";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <MarketingPage
      kicker="404"
      title="That page is missing"
      center
      actions={
        <>
          <Button asChild variant="brand">
            <Link href="/">Unconfuzzle something</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </>
      }
    >
      <p>
        The link may be old, or this clarification only exists in another browser.
      </p>
    </MarketingPage>
  );
}
