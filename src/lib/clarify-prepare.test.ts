import { describe, expect, it } from "vitest";

import { prepareClarify } from "@/lib/clarify-prepare";

describe("prepareClarify", () => {
  it("rejects empty content", async () => {
    const result = await prepareClarify({ content: "   " });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.status).toBe(400);
    }
  });

  it("picks step-by-step for a procedure", async () => {
    const result = await prepareClarify({
      content: "First unplug the kettle. Then reset the breaker. Do not bypass it.",
      mode: "auto",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.prep.mode).toBe("step_by_step");
      expect(result.prep.inputType).toBe("text");
    }
  });

  it("rejects a bogus mode", async () => {
    const result = await prepareClarify({ content: "A confusing letter.", mode: "wizard" });
    expect(result.ok).toBe(false);
  });
});
