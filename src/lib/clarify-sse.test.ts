import { describe, expect, it } from "vitest";

import { consumeSse, encodeSse, isLivePreviewMode } from "@/lib/clarify-sse";

describe("clarify SSE", () => {
  it("round-trips events", () => {
    const encoded = `${encodeSse({ type: "meta", mode: "tl_dr" })}${encodeSse({ type: "delta", text: "Unplug" })}`;
    const { events, rest } = consumeSse(encoded);
    expect(rest).toBe("");
    expect(events).toEqual([
      { type: "meta", mode: "tl_dr" },
      { type: "delta", text: "Unplug" },
    ]);
  });

  it("holds a torn frame", () => {
    const { events, rest } = consumeSse('data: {"type":"del');
    expect(events).toEqual([]);
    expect(rest).toContain("del");
  });

  it("streams live preview only for prose modes", () => {
    expect(isLivePreviewMode("tl_dr")).toBe(true);
    expect(isLivePreviewMode("feynman")).toBe(true);
    expect(isLivePreviewMode("step_by_step")).toBe(false);
  });
});
