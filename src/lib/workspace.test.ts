import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  MAX_HISTORY_ITEMS,
  addHistoryItem,
  clearWorkspace,
  createMemoryStore,
  ensureProfile,
  exportWorkspace,
  importWorkspace,
  readHistory,
  saveProfile,
  searchHistory,
  updateHistoryItem,
  useWorkspaceStore,
  workspaceStats,
} from "@/lib/workspace";

describe("workspace store", () => {
  beforeEach(() => {
    useWorkspaceStore(createMemoryStore());
  });

  afterEach(() => {
    useWorkspaceStore(null);
  });

  it("creates a guest profile and saves preferences", () => {
    const profile = ensureProfile();
    expect(profile.displayName).toBe("Guest");
    expect(profile.defaultMode).toBe("tl_dr");
    const next = saveProfile({ displayName: "Alex", defaultMode: "step_by_step", role: "electrician" });
    expect(next.displayName).toBe("Alex");
    expect(next.defaultMode).toBe("step_by_step");
    expect(next.role).toBe("electrician");
  });

  it("stores history, ratings, and search", () => {
    const item = addHistoryItem({
      source: "How do I bleed a radiator?",
      mode: "step_by_step",
      inputType: "text",
      result: [{ step: 1, text: "Turn off the boiler." }],
    });
    expect(item.title).toContain("bleed a radiator");
    const updated = updateHistoryItem(item.id, { rating: 5, comprehension: "got_it", pinned: true });
    expect(updated?.rating).toBe(5);
    expect(updated?.pinned).toBe(true);
    const found = searchHistory(readHistory(), "radiator");
    expect(found).toHaveLength(1);
    expect(workspaceStats(readHistory()).gotIt).toBe(1);
    const withChecks = updateHistoryItem(item.id, {
      checkedSteps: [1],
      followUps: [{ step: 1, content: "From your source: isolate the circuit first." }],
    });
    expect(withChecks?.checkedSteps).toEqual([1]);
    expect(withChecks?.followUps).toHaveLength(1);
  });

  it("caps history at the max and round-trips export files", () => {
    for (let index = 0; index < MAX_HISTORY_ITEMS + 5; index += 1) {
      addHistoryItem({
        source: `Note ${index}`,
        mode: "tl_dr",
        inputType: "text",
        result: { type: "text", content: `Clear version ${index}` },
      });
    }
    expect(readHistory()).toHaveLength(MAX_HISTORY_ITEMS);

    const exported = exportWorkspace();
    clearWorkspace();
    expect(readHistory()).toHaveLength(0);
    const imported = importWorkspace(JSON.stringify(exported));
    expect(imported.ok).toBe(true);
    expect(readHistory()).toHaveLength(MAX_HISTORY_ITEMS);
  });

  it("rejects invalid imports", () => {
    expect(importWorkspace("{not json").ok).toBe(false);
    expect(importWorkspace(JSON.stringify({ version: 2 })).ok).toBe(false);
  });
});
