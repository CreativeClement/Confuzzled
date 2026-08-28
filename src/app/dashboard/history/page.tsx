"use client";

import { HistoryList } from "@/components/HistoryList";
import { useWorkspace } from "@/components/WorkspaceProvider";

export default function HistoryPage() {
  const { ready, history } = useWorkspace();

  return (
    <main id="main" className="space-y-6">
      <div>
        <p className="kicker">History</p>
        <h1 className="text-3xl font-semibold tracking-tight">Every clarification</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Up to 100 recent clarifications stay on this device. Pin the ones you want to keep handy.
        </p>
      </div>
      <HistoryList
        items={ready ? history : []}
        emptyMessage={ready ? "No clarifications yet. Generate one, or tap Try a sample on the homepage." : "Loading history…"}
      />
    </main>
  );
}
