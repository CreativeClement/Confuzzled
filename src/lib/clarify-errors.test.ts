import { describe, expect, it } from "vitest";

import { clarifyProviderError } from "@/lib/clarify-errors";

describe("clarifyProviderError", () => {
  it("maps quota exhaustion to a payment problem", () => {
    const result = clarifyProviderError({
      statusCode: 429,
      message: "You exceeded your current quota",
      data: { error: { code: "insufficient_quota" } },
    });
    expect(result.status).toBe(402);
    expect(result.message).toMatch(/no credit left/i);
  });

  it("maps invalid keys and names the provider", () => {
    const result = clarifyProviderError(
      { statusCode: 401, message: "Incorrect API key provided" },
      "Groq",
    );
    expect(result.status).toBe(401);
    expect(result.message).toMatch(/Groq rejected that API key/i);
  });

  it("unwraps retry wrappers", () => {
    const result = clarifyProviderError({
      lastError: { statusCode: 429, message: "insufficient_quota" },
    });
    expect(result.status).toBe(402);
  });

  it("maps a plain rate limit", () => {
    const result = clarifyProviderError({ statusCode: 429, message: "slow down" });
    expect(result.status).toBe(429);
    expect(result.message).toMatch(/rate-limiting/i);
  });

  it("maps an unknown model to a settings fix", () => {
    const result = clarifyProviderError({ statusCode: 404, message: "model_not_found" }, "Groq");
    expect(result.status).toBe(400);
    expect(result.message).toMatch(/does not have that model/i);
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
