import { describe, expect, it } from "vitest";

import { migrateLegacyStorage } from "@/lib/storage-migrate";

function store(initial: Record<string, string> = {}) {
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

describe("migrateLegacyStorage", () => {
  it("carries saved work over to the current key names", () => {
    const s = store({
      "confuzzled-history": '[{"id":"1"}]',
      "confuzzled-profile": '{"displayName":"Sam"}',
    });
    expect(migrateLegacyStorage(s)).toBe(2);
    expect(s.dump()["confuzzle-history"]).toBe('[{"id":"1"}]');
    expect(s.dump()["confuzzle-profile"]).toBe('{"displayName":"Sam"}');
    expect(s.dump()["confuzzled-history"]).toBeUndefined();
  });

  it("never overwrites newer data", () => {
    const s = store({
      "confuzzled-history": '["old"]',
      "confuzzle-history": '["new"]',
    });
    migrateLegacyStorage(s);
    expect(s.dump()["confuzzle-history"]).toBe('["new"]');
    expect(s.dump()["confuzzled-history"]).toBeUndefined();
  });

  it("does nothing on a fresh browser", () => {
    const s = store();
    expect(migrateLegacyStorage(s)).toBe(0);
    expect(Object.keys(s.dump())).toHaveLength(0);
  });

  it("survives a storage that throws", () => {
    const throwing = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(() => migrateLegacyStorage(throwing)).not.toThrow();
  });
});
