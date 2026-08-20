"use client";

import { HistoryList } from "@/components/HistoryList";
import { useWorkspace } from "@/components/WorkspaceProvider";

export default function SavedPage() {
  const { ready, history } = useWorkspace();
  const pinned = history.filter((item) => item.pinned);

  return (
    <main id="main" className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pinned</p>
        <h1 className="text-3xl font-semibold tracking-[-0.02em]">Worth returning to</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Pin a result and it is kept here, ready when the same question comes back.
        </p>
      </div>
      <HistoryList
        items={ready ? pinned : []}
        emptyMessage={ready ? "Nothing pinned yet. Open a result and choose Pin." : "Loading…"}
      />
    </main>
  );
}
