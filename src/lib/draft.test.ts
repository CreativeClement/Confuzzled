import { describe, expect, it } from "vitest";

import { clearDraft, DRAFT_STORAGE_KEY, parseDraft, serializeDraft, writeDraft } from "@/lib/draft";
import { createMemoryStore } from "@/lib/workspace";

describe("draft", () => {
  it("round-trips non-empty text", () => {
    const raw = serializeDraft("  A confusing letter  ");
    const parsed = parseDraft(raw);
    expect(parsed?.text).toBe("  A confusing letter  ");
    expect(parsed?.updatedAt).toBeTruthy();
  });

  it("rejects empty and invalid payloads", () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft("{not json")).toBeNull();
    expect(parseDraft(JSON.stringify({ text: "   " }))).toBeNull();
  });

  it("writes and clears through a store", () => {
    const store = createMemoryStore();
    writeDraft(store, "Keep this");
    expect(store.getItem(DRAFT_STORAGE_KEY)).toContain("Keep this");
    clearDraft(store);
    expect(store.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });
});
