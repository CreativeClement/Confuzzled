import { describe, expect, it } from "vitest";

import { recommendOutputMode } from "@/lib/lens";
import { SAMPLE_SOURCE } from "@/lib/sample";

describe("recommendOutputMode", () => {
  it("picks steps for site procedure", () => {
    expect(recommendOutputMode(SAMPLE_SOURCE)).toBe("step_by_step");
  });

  it("picks TL;DR for a short official letter", () => {
    expect(
      recommendOutputMode("Dear tenant, please find enclosed notice of the policy change."),
    ).toBe("tl_dr");
  });

  it("picks Feynman for a concept question", () => {
    expect(
      recommendOutputMode(
        "Explain the concept of photosynthesis in other words. What is actually happening inside a leaf, and why do plants look green to us when the light hits them at noon on a clear day in summer in a quiet garden.",
      ),
    ).toBe("feynman");
  });

  it("picks Socratic when the reader is lost", () => {
    expect(
      recommendOutputMode(
        "I don't understand this email. What does this mean? Why now? I'm lost. I read it twice and I still don't get what they want me to do next, or why it matters for the rest of this week at work.",
      ),
    ).toBe("socratic");
  });

  it("picks visual for system maps", () => {
    expect(recommendOutputMode("The architecture flowchart: frontend depends on the API pipeline.")).toBe(
      "visual",
    );
  });

  it("picks flashcards for exam drill", () => {
    expect(recommendOutputMode("Memorize these vocab terms for the exam.")).toBe("flashcards");
  });

  it("uses bias when two lenses are close", () => {
    expect(recommendOutputMode("Step by step, what is this concept?", "feynman")).toBe("feynman");
  });
});
