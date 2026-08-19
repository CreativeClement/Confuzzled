import { describe, expect, it } from "vitest";

import { clarifyProviderError } from "@/lib/clarify-errors";

describe("clarifyProviderError", () => {
  it("maps OpenAI quota exhaustion", () => {
    const result = clarifyProviderError({
      statusCode: 429,
      message: "You exceeded your current quota",
      data: { error: { code: "insufficient_quota" } },
    });
    expect(result.status).toBe(502);
    expect(result.message).toMatch(/out of quota/i);
  });

  it("maps invalid keys", () => {
    const result = clarifyProviderError({ statusCode: 401, message: "Incorrect API key provided" });
    expect(result.status).toBe(500);
    expect(result.message).toMatch(/rejected/i);
  });

  it("unwraps retry wrappers", () => {
    const result = clarifyProviderError({
      lastError: { statusCode: 429, message: "insufficient_quota" },
    });
    expect(result.status).toBe(502);
  });

  it("falls back for unknown failures", () => {
    const result = clarifyProviderError(new Error("socket hang up"));
    expect(result.status).toBe(500);
    expect(result.message).toMatch(/could not finish/i);
  });

  it("maps timeouts", () => {
    const result = clarifyProviderError(new Error("The operation was aborted due to timeout"));
    expect(result.status).toBe(504);
    expect(result.message).toMatch(/too long/i);
  });
});
