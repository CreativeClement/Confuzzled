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
        <h1 className="text-3xl font-semibold tracking-tight">Keepers</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Pin a result after you generate it, or from the history page, and it lands here.
        </p>
      </div>
      <HistoryList
        items={ready ? pinned : []}
        emptyMessage={ready ? "Nothing pinned yet. Open a result and tap Pin." : "Loading pinned items…"}
      />
    </main>
  );
}
