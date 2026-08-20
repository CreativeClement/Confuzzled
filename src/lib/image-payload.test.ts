import { describe, expect, it } from "vitest";

import { clarifyImageToBuffer, parseClarifyImage } from "@/lib/image-payload";

describe("parseClarifyImage", () => {
  it("accepts a small jpeg payload", () => {
    const data = Buffer.from("fake-jpeg").toString("base64");
    const parsed = parseClarifyImage({ mime: "image/jpeg", data });
    expect(parsed?.ok).toBe(true);
    if (parsed?.ok) {
      expect(clarifyImageToBuffer(parsed.image).toString()).toBe("fake-jpeg");
    }
  });

  it("rejects missing mime, huge payloads, and junk", () => {
    expect(parseClarifyImage(null)).toBeNull();
    expect(parseClarifyImage({ mime: "application/pdf", data: "aaaa" })?.ok).toBe(false);
    expect(parseClarifyImage({ mime: "image/png", data: "%%%" })?.ok).toBe(false);
    expect(parseClarifyImage({ mime: "image/png", data: "a".repeat(1_200_001) })?.ok).toBe(false);
  });
});
