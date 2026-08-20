import { describe, expect, it } from "vitest";

import { looksLikeKey, resolveProvider } from "@/lib/providers";

describe("looksLikeKey", () => {
  it("accepts opaque tokens and rejects pasted noise", () => {
    expect(looksLikeKey("sk-abc123")).toBe(true);
    expect(looksLikeKey("gsk_live_9932")).toBe(true);
    expect(looksLikeKey("")).toBe(false);
    expect(looksLikeKey("sk-abc 123")).toBe(false);
    expect(looksLikeKey('"sk-abc123"')).toBe(false);
    expect(looksLikeKey("sk-abc\n123")).toBe(false);
  });
});

describe("resolveProvider", () => {
  it("defaults to OpenAI with its text model", () => {
    const result = resolveProvider({ key: "sk-test" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider.id).toBe("openai");
      expect(result.provider.baseUrl).toBe("https://api.openai.com/v1");
      expect(result.provider.model).toBe("gpt-4o-mini");
      expect(result.provider.strict).toBe(true);
    }
  });

  it("routes Groq to its OpenAI-compatible endpoint in compatible mode", () => {
    const result = resolveProvider({ provider: "groq", key: "gsk_test" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider.baseUrl).toBe("https://api.groq.com/openai/v1");
      expect(result.provider.strict).toBe(false);
    }
  });

  it("swaps in the vision model when a scan is attached", () => {
    const result = resolveProvider({ provider: "groq", key: "gsk_test", wantsVision: true });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider.model).toBe("meta-llama/llama-4-scout-17b-16e-instruct");
    }
  });

  it("honours an explicit model override", () => {
    const result = resolveProvider({ provider: "openai", key: "sk-test", model: "gpt-4o" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider.model).toBe("gpt-4o");
    }
  });

  it("asks for a key when none is given", () => {
    const result = resolveProvider({ provider: "openai", key: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/api key/i);
    }
  });

  it("rejects a malformed key", () => {
    const result = resolveProvider({ provider: "openai", key: "sk-one two" });
    expect(result.ok).toBe(false);
  });

  it("requires an https base URL for custom endpoints", () => {
    expect(resolveProvider({ provider: "custom", key: "k", model: "m" }).ok).toBe(false);
    expect(
      resolveProvider({ provider: "custom", key: "k", model: "m", baseUrl: "http://example.com/v1" }).ok,
    ).toBe(false);

    const result = resolveProvider({
      provider: "custom",
      key: "k",
      model: "m",
      baseUrl: "https://example.com/v1/",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider.baseUrl).toBe("https://example.com/v1");
    }
  });

  it("explains when a custom endpoint has no model", () => {
    const result = resolveProvider({ provider: "custom", key: "k", baseUrl: "https://example.com/v1" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/model/i);
    }
  });
});
