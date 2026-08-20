import { describe, expect, it } from "vitest";

import { citationsFromOutput, extractCitations } from "@/lib/citations";
import { SAMPLE_MODE, SAMPLE_RESULT, SAMPLE_SOURCE } from "@/lib/sample";

describe("extractCitations", () => {
  it("returns overlapping phrases from the source", () => {
    const source = "Left bank, third from top, is the kitchen small-appliance circuit.";
    const result = "Find the left bank, third from top, then reset the kitchen small-appliance circuit.";
    const citations = extractCitations(source, result);
    expect(citations.some((item) => item.toLowerCase().includes("left bank"))).toBe(true);
  });

  it("returns nothing when the result invents new wording", () => {
    expect(extractCitations("Cut the red wire last.", "Always reverse the polarity first.")).toEqual([]);
  });

  it("pulls sample phrases into chips", () => {
    const citations = citationsFromOutput(SAMPLE_SOURCE, SAMPLE_RESULT, SAMPLE_MODE);
    expect(citations.length).toBeGreaterThan(0);
    expect(citations.join(" ").toLowerCase()).toMatch(/breaker|electrician|toaster|kettle/);
  });
});
