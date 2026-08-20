import { describe, expect, it } from "vitest";

import {
  BYOK_HEADERS,
  byokHeaders,
  clearByok,
  maskKey,
  parseByok,
  readByok,
  writeByok,
  type ByokSettings,
} from "@/lib/byok";

function memoryStore(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (key: string) => (key in data ? data[key] ?? null : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    removeItem: (key: string) => {
      delete data[key];
    },
    dump: () => data,
  };
}

const settings: ByokSettings = {
  provider: "groq",
  key: "gsk_secret_value",
  model: "llama-3.3-70b-versatile",
  baseUrl: "",
};

describe("byok storage", () => {
  it("round-trips settings", () => {
    const store = memoryStore();
    writeByok(store, settings);
    expect(readByok(store)).toEqual(settings);
  });

  it("falls back to empty settings when nothing is stored", () => {
    expect(readByok(memoryStore()).key).toBe("");
  });

  it("survives corrupt storage", () => {
    const store = memoryStore({ "confuzzle-provider": "{not json" });
    expect(readByok(store).key).toBe("");
  });

  it("rejects an unknown provider and falls back to openai", () => {
    expect(parseByok(JSON.stringify({ provider: "wizard", key: "k" }))?.provider).toBe("openai");
  });

  it("clears the key", () => {
    const store = memoryStore();
    writeByok(store, settings);
    clearByok(store);
    expect(readByok(store).key).toBe("");
  });
});

describe("maskKey", () => {
  it("never reveals the middle of a key", () => {
    const masked = maskKey("sk-abcdefghijklmnop");
    expect(masked).not.toContain("defghijkl");
    expect(masked.startsWith("sk-abc")).toBe(true);
    expect(masked.endsWith("mnop")).toBe(true);
  });

  it("masks short keys too", () => {
    expect(maskKey("sk-123")).not.toBe("sk-123");
  });
});

describe("byokHeaders", () => {
  it("sends nothing without a key", () => {
    expect(byokHeaders(null)).toEqual({});
    expect(byokHeaders({ ...settings, key: "" })).toEqual({});
  });

  it("sends provider, key, and model", () => {
    const headers = byokHeaders(settings);
    expect(headers[BYOK_HEADERS.provider]).toBe("groq");
    expect(headers[BYOK_HEADERS.key]).toBe("gsk_secret_value");
    expect(headers[BYOK_HEADERS.model]).toBe("llama-3.3-70b-versatile");
    expect(headers[BYOK_HEADERS.baseUrl]).toBeUndefined();
  });
});
