import { describe, expect, it } from "vitest";

import { redact, safeErrorLine } from "@/lib/log-safe";

describe("redact", () => {
  it("removes OpenAI-style keys", () => {
    const out = redact("failed with sk-abcdef0123456789 attached");
    expect(out).not.toContain("sk-abcdef0123456789");
    expect(out).toContain("[redacted]");
  });

  it("removes Groq-style keys", () => {
    expect(redact("gsk_ABCDEFGH12345678")).not.toContain("ABCDEFGH12345678");
  });

  it("removes bearer tokens", () => {
    expect(redact("Authorization: Bearer abcdef0123456789")).not.toContain("abcdef0123456789");
  });

  it("removes keys a provider already partly masked", () => {
    const out = redact("Incorrect API key provided: sk-super*****************7890.");
    expect(out).not.toContain("sk-super");
    expect(out).not.toContain("7890");
  });

  it("leaves harmless text alone", () => {
    expect(redact("model_not_found for gpt-4o-mini")).toBe("model_not_found for gpt-4o-mini");
    expect(redact("429 rate limit on llama-3.3-70b-versatile")).toContain("llama-3.3-70b-versatile");
  });
});

describe("safeErrorLine", () => {
  it("summarises an Error without its key", () => {
    const line = safeErrorLine(new Error("401 from provider, key sk-abcdef0123456789"));
    expect(line).toContain("Error:");
    expect(line).not.toContain("sk-abcdef0123456789");
  });

  it("handles non-error values", () => {
    expect(safeErrorLine({ statusCode: 429 })).toContain("429");
    expect(safeErrorLine("plain string")).toBe("plain string");
  });

  it("caps runaway payloads", () => {
    expect(safeErrorLine("x".repeat(5_000)).length).toBeLessThanOrEqual(500);
  });
});
