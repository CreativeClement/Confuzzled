import { describe, expect, it } from "vitest";

import { detectSafetyNotice } from "@/lib/safety";
import { SAMPLE_SOURCE } from "@/lib/sample";

describe("detectSafetyNotice", () => {
  it("flags electrical source material", () => {
    const notice = detectSafetyNotice(SAMPLE_SOURCE);
    expect(notice?.kind).toBe("electrical");
    expect(notice?.verifier).toMatch(/electrician/i);
  });

  it("returns null for ordinary text", () => {
    expect(detectSafetyNotice("Preheat the oven to 180 and stir the sauce.")).toBeNull();
  });

  it("flags medical dosage language", () => {
    expect(detectSafetyNotice("The prescription dosage is 5 mg twice daily.")?.kind).toBe("medical");
  });
});
