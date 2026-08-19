import { describe, expect, it } from "vitest";

import {
  extractHttpUrls,
  htmlToPlainText,
  isPrivateIPv4,
  parsePublicHttpUrl,
} from "@/lib/public-url";

describe("parsePublicHttpUrl", () => {
  it("accepts https pages", () => {
    const parsed = parsePublicHttpUrl("https://example.com/policy");
    expect(parsed.ok).toBe(true);
  });

  it("blocks localhost, credentials, and private IPs", () => {
    expect(parsePublicHttpUrl("http://localhost/secret").ok).toBe(false);
    expect(parsePublicHttpUrl("https://user:pass@example.com").ok).toBe(false);
    expect(parsePublicHttpUrl("http://127.0.0.1/").ok).toBe(false);
    expect(parsePublicHttpUrl("http://192.168.1.9/admin").ok).toBe(false);
    expect(parsePublicHttpUrl("ftp://example.com/file").ok).toBe(false);
  });
});

describe("isPrivateIPv4", () => {
  it("classifies RFC1918 and loopback", () => {
    expect(isPrivateIPv4("10.0.0.8")).toBe(true);
    expect(isPrivateIPv4("172.16.0.1")).toBe(true);
    expect(isPrivateIPv4("8.8.8.8")).toBe(false);
  });
});

describe("extractHttpUrls and htmlToPlainText", () => {
  it("pulls http(s) links", () => {
    expect(extractHttpUrls("See https://example.com/a and https://example.com/b.")).toEqual([
      "https://example.com/a",
      "https://example.com/b",
    ]);
  });

  it("strips scripts and tags", () => {
    expect(htmlToPlainText("<html><script>alert(1)</script><p>Hello&nbsp;world</p></html>")).toBe(
      "Hello world",
    );
  });
});
