"use client";

import { HistoryList } from "@/components/HistoryList";
import { useWorkspace } from "@/components/WorkspaceProvider";

export default function HistoryPage() {
  const { ready, history } = useWorkspace();

  return (
    <main id="main" className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">History</p>
        <h1 className="text-3xl font-semibold tracking-[-0.02em]">Everything you’ve run</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          The last 100 results, kept on this device. Pin the ones worth returning to.
        </p>
      </div>
      <HistoryList
        items={ready ? history : []}
        emptyMessage={ready ? "Nothing yet. Run something, or try the sample on the homepage." : "Loading…"}
      />
    </main>
  );
}
